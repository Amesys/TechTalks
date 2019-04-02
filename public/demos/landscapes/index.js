const webcamElement = document.getElementById('webcam')
const classifier = knnClassifier.create()
let net

let landscape
let landscapeImages = {}
let title
let last40frames = []
let knnTrained = false
let algoStopped = false

try {
	landscape = document.getElementById('landscape')
	title = document.getElementById('title')
} catch (err) {
	console.log('Could not retrieve inner elements')
}

async function getImage (label) {
	return new Promise((resolve, reject) => {
		const req = new XMLHttpRequest()
		const GOOGLE_APIKEY = 'AIzaSyCJkFndYdWtAa1_x-SAanFigufYO4g00qA'
		const SEARCH_ENGINE_ID = '013530136743322147159:fjktks2ndia'
		const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_APIKEY}&cx=${SEARCH_ENGINE_ID}&q=${label}&searchType=image`
		req.open('GET', url)
		req.send()
		req.onreadystatechange = (e) => {
			if (req.status === 200 && req.responseText != null) {
				try {
					let response = JSON.parse(req.responseText)
					if (response != null && response.items.length > 0) {
						resolve(response)
					} else {
						console.log('Didnt fetch any result ->', req)
						reject()
					}
				} catch (err) {
				}
			} else {
				console.log('Status de la réponse: %d (%s)', req.status, req.response)
				let err = req.response.error.errors[0] !== undefine ? eq.response.error.errors[0] : { message: 'Empty request' }
				reject(err)
			}
		}
	})
}

function updateFront (country) {
	console.log(`Trying ${country}`)
	let randomIndex = Math.floor(Math.random() * 10)
	landscape.src = landscapeImages[country].items[randomIndex].link
	title.innerHTML = landscapeImages[country].items[randomIndex].title
}

async function loadLandscapes () {
	console.log('Fetching landscapes collections on Google...')
	try {
		landscapeImages.A = await getImage('Paysage Australie')
		landscapeImages.B = await getImage('Paysage Antarctique')
		landscapeImages.C = await getImage('Paysage Etats-Unis')
		console.log('Successfully fetched landscapes images')
	} catch (err) {
		console.log(err.message)
	}
}

async function app () {
	console.log('Loading mobilenet...')
	// Load the model.
	net = await mobilenet.load()
	console.log('Successfully loaded model')

	await loadLandscapes()

	await setupWebcam()

	// Reads an image from the webcam and associates it with a specific class
	// index.
	const addExample = classId => {
		// Get the intermediate activation of MobileNet 'conv_preds' and pass that
		// to the KNN classifier.
		const activation = net.infer(webcamElement, 'conv_preds')

		// Pass the intermediate activation to the classifier.
		classifier.addExample(activation, classId)
	}

	// When clicking a button, add an example for that class.
	document.getElementById('class-a').addEventListener('click', () => addExample(0))
	document.getElementById('class-b').addEventListener('click', () => addExample(1))
	document.getElementById('class-c').addEventListener('click', () => addExample(2))
	document.getElementById('knnStatus').addEventListener('click', () => {
		knnTrained = true
	})
	document.getElementById('stopAlgo').addEventListener('click', () => {
		algoStopped = true
		landscape.src = 'ginniHendrix.png'
		title.innerHTML = 'Custom classifier stopped'
	})

	while (true) {
		if (knnTrained && !algoStopped && classifier.getNumClasses() > 0) {
			// Get the activation from mobilenet from the webcam.
			const activation = net.infer(webcamElement, 'conv_preds')
			// Get the most likely class and confidences from the classifier module.
			const result = await classifier.predictClass(activation)

			const classes = ['A', 'B', 'C']
			document.getElementById('console').innerText = `
				prediction: ${classes[result.classIndex]}\n
				probability: ${result.confidences[result.classIndex]}`

			if (last40frames.length === 40) {
				console.log('Majority vote ->', majorityVote(last40frames))
				updateFront(majorityVote(last40frames))
				last40frames = []
			} else {
				last40frames.push(classes[result.classIndex])
			}
		}

		await tf.nextFrame()
	}
}

function majorityVote (arr) {
	return arr.sort((a, b) =>
		arr.filter(v => v === a).length -
        arr.filter(v => v === b).length
	).pop()
}

async function setupWebcam () {
	return new Promise((resolve, reject) => {
		const navigatorAny = navigator
		navigator.getUserMedia = navigator.getUserMedia ||
			navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
			navigatorAny.msGetUserMedias
		if (navigator.getUserMedia) {
			navigator.getUserMedia({ video: true },
				stream => {
					webcamElement.srcObject = stream
					webcamElement.addEventListener('loadeddata', () => resolve(), false)
				},
				error => reject(error))
		} else {
			reject()
		}
	})
}

app()
