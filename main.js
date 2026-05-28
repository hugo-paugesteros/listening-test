let CONFIG;
let rounds = [];
const steps = document.querySelector('#steps');
const progress = document.querySelector('#progress');
const form = document.querySelector('form');
const prev = document.querySelector('#prev');
const next = document.querySelector('#next');
const saveBtn = document.querySelector('#save-btn');

// Gardée au cas où, mais non appelée pour respecter l'ordre du YAML
function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        if (Math.random() > 0.5) {
            [array[currentIndex].a, array[currentIndex].b] = [array[currentIndex].b, array[currentIndex].a];
        }
    }
    return array;
}

function loadTest(configRounds) {
    configRounds.forEach((round, i) => {
        // For ABX, pick a random X if multiple are provided
        const x = Array.isArray(round.x)
            ? round.x[Math.floor(Math.random() * round.x.length)]
            : round.x;
            
        // ABXY
        const y = Array.isArray(round.y)
            ? round.y[Math.floor(Math.random() * round.y.length)]
            : round.y;

        rounds.push({
            id: i,
            title: round.title || `Round ${i + 1}`, // Ajout du titre (fallback si absent du YAML)
            a: round.a,
            b: round.b,
            x: x,
            y: y,
            type: round.type // Optional override for mixed tests
        });
    });

    // shuffle(rounds) <--- LIGNE DÉSACTIVÉE pour garder l'ordre d'écriture du YAML
    return rounds;
}

function render(rounds) {
    rounds.forEach((round, i) => {
        let step = document.createElement('li');
        steps.insertBefore(step, steps.lastElementChild);

        let formSection = document.createElement('div');
        formSection.classList.add('form-step');

        const currentType = round.type || CONFIG.testType;
        
        // Structure HTML du titre pour chaque round
        const titleHTML = `<h3 class="round-title" style="text-align: center; margin-bottom: 20px;">${round.title}</h3>`;

        if (currentType === 'abx') {
            formSection.innerHTML = titleHTML + `
            <abx-test
                path-a="${CONFIG.test.audioRoot}${round.a}"
                path-b="${CONFIG.test.audioRoot}${round.b}"
                path-x="${CONFIG.test.audioRoot}${round.x}"
                instruction="${CONFIG.test.abx.instruction}"
            >
            </abx-test>
            `;
        } else if (currentType === 'abxy') {
            formSection.innerHTML = titleHTML + `
            <abxy-test
                path-a="${CONFIG.test.audioRoot}${round.a}"
                path-b="${CONFIG.test.audioRoot}${round.b}"
                path-x="${CONFIG.test.audioRoot}${round.x}"
                path-y="${CONFIG.test.audioRoot}${round.y}"
                instruction="${CONFIG.test.abxy.instruction}"
            >
            </abxy-test>`;
        } else {
            formSection.innerHTML = titleHTML + `
            <similarity-test
                path-x="${CONFIG.test.audioRoot}${round.a}"
                path-y="${CONFIG.test.audioRoot}${round.b}"
                min="${CONFIG.test.similarity.scale.min}"
                max="${CONFIG.test.similarity.scale.max}"
                value="${CONFIG.test.similarity.scale.default}"
                label-min="${CONFIG.test.similarity.scale.labels.min}"
                label-max="${CONFIG.test.similarity.scale.labels.max}"
                instruction="${CONFIG.test.similarity.instruction}"
            >
            </similarity-test>
            `;
        }
        form.insertBefore(formSection, form.lastElementChild);
    });

    updatePage(page);
}

function validateCurrentStep() {
    const currentStepEl = form.children[page - 1];
    const abxComponent = currentStepEl.querySelector('abx-test');
    const abxyComponent = currentStepEl.querySelector('abxy-test');

    if (abxComponent && CONFIG.test.validate) {
        const hasAnswer = abxComponent.getResults() !== null;
        next.setAttribute('data-disabled', !hasAnswer);
    } 
    else if (abxyComponent && CONFIG.test.validate) {
        const hasAnswer = abxyComponent.getResults() !== null;
        next.setAttribute('data-disabled', !hasAnswer);
    } else {
        next.setAttribute('data-disabled', page == form.childElementCount);
    }
}

function updatePage(page) {
    // Stop all audio players when changing pages
    document.querySelectorAll('audio-player').forEach(p => p.stop());
    document.querySelectorAll('similarity-test').forEach(test => test.pause());
    document.querySelectorAll('abx-test').forEach(test => test.pause());
    document.querySelectorAll('abxy-test').forEach(test => test.pause());

    history.replaceState({}, '', `#${page}`);

    progress.style.setProperty('--progress', (page - 1) / (steps.childElementCount - 1));

    prev.setAttribute('data-disabled', page == 1);

    if (page > 1 && page < steps.childElementCount) {
        validateCurrentStep();
    } else {
        next.setAttribute('data-disabled', page == form.childElementCount);
    }

    for (let child of steps.children) { child.classList.remove('active'); } 
    steps.children[page - 1].classList.add('active');

    for (let child of form.children) { child.classList.remove('active'); }
    form.children[page - 1].classList.add('active');
}

function initUI() {
    document.getElementById('main-title').innerText = CONFIG.title;
    document.getElementById('intro-title').innerText = CONFIG.intro.title;

    const introTextContainer = document.getElementById('intro-text');
    CONFIG.intro.text.forEach(text => {
        const p = document.createElement('p');
        p.innerHTML = text;
        introTextContainer.appendChild(p);
    });

    document.getElementById('fam-title').innerText = CONFIG.familiarization.title;
    document.getElementById('fam-text').innerText = CONFIG.familiarization.text;

    const famAudiosContainer = document.getElementById('fam-audios');
    CONFIG.familiarization.audios.forEach(audioData => {
        const player = document.createElement('audio-player');
        player.setAttribute('label', audioData.label);
        player.setAttribute('src', audioData.src);
        famAudiosContainer.appendChild(player);
    });

    document.getElementById('save-btn').innerText = CONFIG.conclusion.buttonText;
    document.getElementById('conclu-text').innerText = CONFIG.conclusion.instruction;
}

// Global audio management: pause others when one starts
window.addEventListener('audio-play', (e) => {
    const activePlayer = e.detail.player;

    document.querySelectorAll('audio-player').forEach(p => {
        if (p !== activePlayer) p.stop();
    });
    
    document.querySelectorAll('similarity-test').forEach(test => {
        if (test.playerX !== activePlayer) test.playerX.stop();
        if (test.playerY !== activePlayer) test.playerY.stop();
    });
    
    document.querySelectorAll('abx-test, abxy-test').forEach(test => {
        test.shadowRoot.querySelectorAll('audio-player').forEach(p => {
            if (p !== activePlayer) p.stop();
        });
    });
});

document.addEventListener('answer-selected', () => {
    validateCurrentStep();
});

async function start() {
    try {
        const response = await fetch('config.yaml');
        const yamlText = await response.text();
        CONFIG = jsyaml.load(yamlText);

        initUI();
        render(loadTest(CONFIG.test.rounds));
        console.log(rounds);
    } catch (error) {
        console.error("Failed to initialize the test:", error);
        alert("Error: Could not load configuration. Please check the console for details.");
    }
}

start();

let page = window.location.hash ? parseInt(location.hash.substring(1)) : 1;

next.addEventListener('click', () => {
    if (next.getAttribute('data-disabled') === 'true') return;
    page = page < form.childElementCount ? page + 1 : page;
    updatePage(page);
});

prev.addEventListener('click', () => {
    page = page > 1 ? page - 1 : page;
    updatePage(page);
});

document.addEventListener('keydown', (event) => {
    if (event.key == 'ArrowLeft') {
        page = page > 1 ? page - 1 : page;
        updatePage(page);
    }
    if (event.key == 'ArrowRight') {
        if (next.getAttribute('data-disabled') === 'true') return;
        page = page < form.childElementCount ? page + 1 : page;
        updatePage(page);
    }
});

async function submitTestResults(testData) {
    try {
        const response = await fetch(CONFIG.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: testData
        });
        if (response.ok) {
            alert("Thank you! Your evaluation has been securely submitted.");
        } else {
            throw new Error("Network response was not ok.");
        }
    } catch (error) {
        console.error("Submission failed, falling back to manual download.", error);
        downloadJSON(testData);
    }
}

function downloadJSON(testData) {
    let filename = prompt("Please enter your name or ID for the file:", "results");
    if (!filename) filename = "results";
    if (!filename.endsWith('.json')) filename += '.json';

    const type = "application/json";
    const a = document.createElement("a");
    const file = new Blob([testData], { type: type });
    a.href = URL.createObjectURL(file);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    alert(`Results saved as ${filename}. If submission failed, please send it manually to ${CONFIG.contactEmail}`);
}

// CORRECTION BULLETPROOF CONTRE LES RÉSULTATS NULL
saveBtn.addEventListener('click', (e) => {
    e.preventDefault();

    let results = [];
    
    // Filtre pour ne cibler que les conteneurs qui embarquent un vrai composant de test
    const allSteps = Array.from(form.querySelectorAll('.form-step'));
    const testSteps = allSteps.filter(step => step.querySelector('abx-test, abxy-test, similarity-test'));

    rounds.forEach((round, i) => {
        const stepEl = testSteps[i]; 
        
        if (stepEl) {
            const testComponent = stepEl.querySelector('abx-test, abxy-test, similarity-test');
            results.push({
                test: round,
                result: testComponent ? testComponent.getResults() : null
            });
        } else {
            console.warn(`Impossible de cibler le conteneur du round HTML à l'index : ${i}`);
            results.push({ test: round, result: null });
        }
    });

    console.log("Données collectées prêtes :", results);
    const json = JSON.stringify(results, null, 2);
    submitTestResults(json);
});