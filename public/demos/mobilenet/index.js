let net

async function app () {
	console.log('Loading mobilenet..')

	// Load the model.
	net = await mobilenet.load()
	console.log('Successfully loaded model')

	// Make a prediction through the model on our image.
	const imgEl = document.getElementById('img')
	const result = await net.classify(imgEl)
	document.getElementById('pred1').innerHTML = JSON.stringify(result[0], null, 2)
	document.getElementById('pred2').innerHTML = JSON.stringify(result[1], null, 2)
	document.getElementById('pred3').innerHTML = JSON.stringify(result[2], null, 2)

	console.log(result)
}

app()
