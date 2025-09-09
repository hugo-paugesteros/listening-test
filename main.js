function click(button) {
    let formStep = button.parentElement
    let audio = button.querySelector('audio')
    let paused = audio.paused

    formStep.querySelectorAll('audio').forEach(audio => audio.pause())

    if (paused) {
        audio.play()
    } else {
        audio.pause()
    }

    audio.addEventListener('timeupdate', (e) => {
        let seekPosition = e.target.currentTime * (100 / e.target.duration)
        button.style.setProperty('--progress-value', seekPosition)
    })

    if (!button.classList.contains('r')) {
        let other = button.classList.contains('x') ? button.nextElementSibling : button.previousElementSibling

        button.classList.add('active')
        other.classList.remove('active')

        formStep.querySelector('div').textContent = `${button.textContent} est selectionné`
    }
}

// function subsets(arr, length) {
//     const result = [];
// 
//     // Recursive function to generate subsets
//     function generateSubsets(currentSubset, start) {
//         if (currentSubset.length === length) {
//             result.push([...currentSubset]); // Add a copy of the currentSubset to the result
//             return;
//         }
// 
//         for (let i = start; i < arr.length; i++) {
//             currentSubset.push(arr[i]);
//             generateSubsets(currentSubset, i + 1);
//             currentSubset.pop();
//         }
//     }
// 
//     generateSubsets([], 0);
//     return result;
// }
// 
// let rounds = []
// const players = ['Clara', 'SMD', 'Paul']
// const violins = ['A', 'B', 'C']
// 
// subsets(players, 2).forEach((player_subset) => {
//     subsets(violins, 2).forEach((violin_subset) => {
//         other = players.filter(player => !player_subset.includes(player))
//         let session = 1;
//         round = {
//             ref: `${violin_subset[0]}-${player_subset[0]}-tchai-${session}.wav`,
//             a: `${violin_subset[0]}-${player_subset[1]}-tchai-${session}.wav`,
//             b: `${violin_subset[1]}-${other}-tchai-${session}.wav`,
//         }
//         rounds.push(round)
//     })
// })

let rounds = []

fetch('test.json')
    .then((response) => response.json())
    .then((json) => render(loadTest(json)));

function loadTest(json) {
    json.forEach(round => {
        rounds.push({
            ref: `${round[0].violin}-${round[0].player}-${round[0].session}.wav`,
            a: `${round[1].violin}-${round[1].player}-${round[1].session}.wav`,
            b: `${round[2].violin}-${round[2].player}-${round[2].session}.wav`,
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
        <label class="audio r">
        R
        <audio src="audio/normalized/${round.ref}"></audio>
        </label>
        <label class="audio x" for="${i + 1}-x">
        X
        <audio src="audio/normalized/${round.a}"></audio>
        </label>
        <label class="audio y" for="${i + 1}-y">
        Y
        <audio src="audio/normalized/${round.b}"></audio>
        </label>
        <div></div>
        <input type="radio" name="${i + 1}" id="${i + 1}-x" value="${i + 1}-x">
        <input type="radio" name="${i + 1}" id="${i + 1}-y" value="${i + 1}-y">
        `
        form.insertBefore(formSection, form.children[i + 1])
    })

    document.querySelectorAll('.form-step label.audio').forEach(
        button => button.addEventListener('click', (e) => {
            click(button)
        })
    )

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
    const formData = new FormData(form)
    const formProps = Object.fromEntries(formData)
    const json = JSON.stringify(formProps)
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
