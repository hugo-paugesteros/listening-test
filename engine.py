import pandas as pd
import yaml
from typing import List, Any, Dict, Optional


class ABXEngine:

    def __init__(self, dataset_path: str, config_path: str) -> None:
        print("Loading dataset :")
        self.dataset = pd.read_pickle(dataset_path)
        ##
        missing = self.dataset[
            (self.dataset.player == "SMD")
            & (self.dataset.condition == "non-aveugle")
            & (self.dataset.violin == "C")
            & (self.dataset.extract == "tchai")
            & (self.dataset.session == 2)
        ]
        self.dataset = (
            self.dataset[
                (self.dataset.session != 4)
                & (self.dataset.condition == "aveugle")
                & (self.dataset.player.isin(["Paul", "Clara", "SMD"]))
                & (~self.dataset.extract.isin(["free", "?"]))
                # & (self.dataset.extract.isin(["tchai"]))
            ]
            .drop_duplicates(subset=["player", "violin", "extract", "session"])
            .reset_index()
        )
        self.dataset = pd.concat([self.dataset, missing], ignore_index=True)
        self.dataset.rename(columns={"extract": "excerpt"}, inplace=True)

        ##
        print(self.dataset.info())
        print(self.dataset[["player", "violin", "excerpt", "session"]])

        print("Loading configuration :")
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
        print(self.config)

    def run(self):
        for test in self.config.get("tests", []):
            print(f"Processing Test : {test.get("name", "unamed")}")

            rules = test.get("rules", {})
            triplets = self._find_all_triplets(rules)

            print(len(triplets))
            for x, a, b in triplets:
                print(
                    f"{x['player']}:{x['violin']}:{x['session']} \t {a['player']}:{a['violin']}:{a['session']} \t {b['player']}:{b['violin']}:{b['session']}"
                )

    def _find_all_triplets(self, rules: Dict):
        triplets = []

        for _, x_row in self.dataset.iterrows():
            if not self._is_candidate_valid(x_row, rules.get("X", {})):
                continue
            a_candidates = self._find_candidates(rules.get("A", {}), x_context=x_row)

            for _, a_row in a_candidates.iterrows():
                b_candidates = self._find_candidates(
                    rules.get("B", {}), x_context=x_row, a_context=a_row
                )

                for _, b_row in b_candidates.iterrows():
                    triplets.append((x_row.to_dict(), a_row.to_dict(), b_row.to_dict()))

        return triplets

    def _is_candidate_valid(self, row, rules):
        temp_df = self._apply_rules(pd.DataFrame([row]), rules, None, None)
        return not temp_df.empty

    def _find_candidates(self, rules, x_context=None, a_context=None):
        candidates = self.dataset.copy()
        candidates = self._apply_rules(candidates, rules, x_context, a_context)
        return candidates

    def _apply_rules(self, df, rules, x_context, a_context):
        if not rules:
            return df

        filtered = df.copy()
        for factor, condition in rules.items():
            if isinstance(condition, list):
                for sub_condition in condition:
                    filtered = self._apply_rule(
                        filtered, factor, sub_condition, x_context, a_context
                    )
            else:
                filtered = self._apply_rule(
                    filtered, factor, condition, x_context, a_context
                )

        return filtered

    def _apply_rule(self, df, factor, condition, x_context, a_context):
        if condition == "*":
            return df

        negated = False
        if condition.startswith("!"):
            negated = True
            condition = condition[1:]

        if "." in condition:
            ref_obj, ref_factor = condition.split(".")
            context = x_context if ref_obj.upper() == "X" else a_context
            target_value = context[ref_factor]
        else:
            target_value = condition

        if negated:
            return df.query(f"{factor} != {target_value}")
            return df[df[factor] != target_value]
        else:
            return df[df[factor] == target_value]


if __name__ == "__main__":
    engine = ABXEngine(
        "/home/hugo/Thèse/identification/data/processed/dataset_cnsm.pkl",
        "test_opening.yaml",
    )
    engine.run()
