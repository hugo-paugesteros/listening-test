class SimilarityTest extends HTMLElement {

    static get observedAttributes() {
        return [`path-x`, `path-y`];
    }

    constructor() {
        super()

        this.shadow = this.attachShadow({ mode: "open" })
        let id = Math.random().toString(16).slice(2)

        this.shadow.innerHTML = `
        <div class="audios">
            <label class="audio x" for="${id}-x">
                X
                <audio src="audio/normalized/${id}"></audio>
            </label>
            <label class="audio y" for="${id}-y">
                Y
                <audio src="audio/normalized/${id}"></audio>
            </label>
            <input type="radio" name="${id}" id="${id}-x" value="${id}-x">
            <input type="radio" name="${id}" id="${id}-y" value="${id}-y">
        </div>
        <div></div>
        <input type="range" name="" id="" min="0" max="10" value="5" list="values" onkeydown="event.preventDefault()">

        <datalist id="values">
            <option value="0" label="Similaires"></option>
            <option value="10" label="Différents"></option>
        </datalist>

        <style>
            :host {
                display: block;
                 display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;

                datalist {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    width: 200px;
                }

                option {
                    padding: 0;
                }

                input[type="range"] {
                    width: 200px;
                    margin: 0;
                }

                & .audios {
                    display: flex;
                    width: 100%;
                    justify-content: center;
                    align-items: center;
                    gap: 5em;
                }

                & input[type=radio] {
                    display: none;
                }

                & label.audio {
                    --progress-value: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    padding: 0;
                    width: 50px;
                    aspect-ratio: 1;
                    border-radius: 50%;

                    background:
                        radial-gradient(closest-side, white 90%, transparent 91% 100%),
                        conic-gradient(var(--color) calc(var(--progress-value) * 1%), transparent 0);

                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);

                    transition: all .2s;

                    &.active {
                        box-shadow: unset;
                        background:
                            radial-gradient(closest-side, rgb(221, 221, 255) 80%, white 80%, white 90%, transparent 91% 100%),
                            conic-gradient(blue calc(var(--progress-value) * 1%), transparent 0);
                    }
                }
            }
        </style>
        `

        this.audioX = this.shadow.querySelector('.audio.x audio')
        this.audioY = this.shadow.querySelector('.audio.y audio')

        this.shadow.querySelectorAll('.audio').forEach(
            button => {
                button.addEventListener('click', (e) => {
                    this.click(button)
                })
            }
        )

        this.shadow.querySelector('input[type=range]').addEventListener('input', (e) => {
            let value = e.target.value
            this.shadow.querySelector('.audios').style.gap = `${value}em`
        })
    }

    click(button) {
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
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === `path-x`) {
            this.audioX.src = newValue
        }
        if (name === `path-y`) {
            this.audioY.src = newValue
        }
    }

    pause() {
        this.shadow.querySelectorAll('audio').forEach(audio => audio.pause())
    }

}

customElements.define('similarity-test', SimilarityTest)