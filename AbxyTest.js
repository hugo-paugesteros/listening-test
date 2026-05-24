class AbxyTest extends HTMLElement {
    static get observedAttributes() {
        return ['path-a', 'path-b', 'path-x', 'path-y', 'instruction'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.id = Math.random().toString(16).slice(2);
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this.shadowRoot.innerHTML !== '') {
            if (name === 'instruction') {
                this.shadowRoot.querySelector('.instruction').innerHTML = newValue;
            }
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2rem;
                }
                .audio-row {
                    display: flex;
                    gap: 4rem;
                    justify-content: center;
                    align-items: center;
                }
                .choice-row {
                    display: flex;
                    gap: 3rem;
                    align-items: center;
                    margin-top: 1rem;
                }
                .choice-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }
                input[type="radio"] {
                    width: 1.3rem;
                    height: 1.3rem;
                    cursor: pointer;
                }
                label {
                    font-size: 1.1rem;
                    cursor: pointer;
                    line-height: 1.4; 
                }
                .instruction {
                    font-size: 1.2rem;
                    font-weight: bold;
                }
            </style>
            <div class="instruction">${this.getAttribute('instruction') || 'Compare X and Y to A and B'}</div>
            <div class="audio-row">
                <audio-player label="A" src="${this.getAttribute('path-a')}"></audio-player>
                <audio-player label="B" src="${this.getAttribute('path-b')}"></audio-player>
            </div>
            <div class="choice-row">
                <div class="choice-item">
                    <input type="radio" id="choiceA-${this.id}" name="choice-${this.id}" value="configuration-1">
                    <label for="choiceA-${this.id}">X is A <br> Y is B</label>
                </div>
                <div class="choice-item">
                    <input type="radio" id="choiceB-${this.id}" name="choice-${this.id}" value="configuration-2">
                    <label for="choiceB-${this.id}">X is B <br> Y is A</label>
                </div>
            </div>
            <div class="audio-row">
                <audio-player label="X" src="${this.getAttribute('path-x')}"></audio-player>
                <audio-player label="Y" src="${this.getAttribute('path-y')}"></audio-player>
            </div>
        `;

        this.shadowRoot.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.dispatchEvent(new CustomEvent('answer-selected', {
                    bubbles: true,
                    composed: true
                }));
            });
        });
    }
 
    getResults() {
        const checkedRadio = this.shadowRoot.querySelector('input[type=radio]:checked');
        if (!checkedRadio) return null;
        if (checkedRadio.value === 'configuration-1') {
            return { x: "A", y: "B" };
        } else if (checkedRadio.value === 'configuration-2') {
            return { x: "B", y: "A" };
        }
        return null;
    }

    pause() {
        this.shadowRoot.querySelectorAll('audio-player').forEach(p => p.stop());
    }
}

customElements.define('abxy-test', AbxyTest);