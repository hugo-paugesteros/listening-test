let rounds = []

fetch('test2.json')
    .then((response) => response.json())
    .then((json) => render(loadTest(json)));

function loadTest(json) {
    json.forEach(round => {
        rounds.push({
            // ref: `${round[0].violin}-${round[0].player}-${round[0].session}.wav`,
            a: `${round[0].violin}-${round[0].player}-${round[0].session}.wav`,
            b: `${round[1].violin}-${round[1].player}-${round[1].session}.wav`,
        })
    })
    return rounds
}

function render(rounds) {
    rounds.forEach((round, i) => {
        // Create timeline
        let step = document.createElement('li')
        steps.insertBefore(step, steps.children[i + 1])

        let formSection = document.createElement('div')
        formSection.classList.add('form-step')
        formSection.innerHTML = `
        <similarity-test
            path-x="audio/normalized/${round.a}"
            path-y="audio/normalized/${round.b}"
        >
        </similarity-test>
        `
        form.insertBefore(formSection, form.children[i + 1])
    })

    updatePage(page)
}

let page = window.location.hash ? parseInt(location.hash.substring(1)) : 1

const steps = document.querySelector('#steps')
// steps.innerHTML = ''s
const progress = document.querySelector('#progress')

const form = document.querySelector('form')
// form.innerHTML = ''

const prev = document.querySelector('#prev')
const next = document.querySelector('#next')

function updatePage(page) {
    // Pause all audios in the page
    document.querySelectorAll('similarity-test').forEach(test => test.pause())

    history.replaceState({}, '', `#${page}`)

    // Update timeline
    progress.style.setProperty('--progress', (page - 1) / (rounds.length - 1 + 2))

    // Update prev/next buttons
    prev.setAttribute('data-disabled', page == 1)
    next.setAttribute('data-disabled', page == rounds.length + 2)

    for (child of steps.children) { child.classList.remove('active') }
    steps.children[page - 1].classList.add('active')

    for (child of form.children) { child.classList.remove('active') }
    form.children[page - 1].classList.add('active')
}

next.addEventListener('click', () => {
    page = page < rounds.length + 2 ? page + 1 : page
    updatePage(page)
})

prev.addEventListener('click', () => {
    page = page > 1 ? page - 1 : page
    updatePage(page)
})

document.addEventListener('keydown', (event) => {
    if (event.key == 'ArrowLeft') {
        let previous = page
        page = page > 1 ? page - 1 : page
        updatePage(page)
    }

    if (event.key == 'ArrowRight') {
        let previous = page
        page = page < rounds.length + 2 ? page + 1 : page
        updatePage(page)
    }
})

document.querySelectorAll('.form-step label.audio').forEach(
    button => button.addEventListener('click', (e) => {
        click(button)
    })
)

const saveBtn = document.querySelector('#conclu button')
saveBtn.addEventListener('click', (e) => {
    e.preventDefault()
    let results = []
    console.log(document.querySelectorAll('similarity-test'))
    document.querySelectorAll('similarity-test').forEach(test => {
        results.push(test.getResults())
    })
    console.log(results)
    const json = JSON.stringify(results)
    const name = "sample.json";
    const type = "text/plain";

    // create file
    const a = document.createElement("a");
    const file = new Blob([json], { type: type });
    a.href = URL.createObjectURL(file);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
})
