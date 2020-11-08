const video = document.getElementById('video')

var recognize = false;

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
]).then(startVideo)

function startVideo(){
  navigator.getUserMedia(
    {video:{}},
    stream=>video.srcObject = stream,
    err=>console.error(err)
  );
  
};


video.addEventListener('play',()=>{
  start();
}) 

async function start(){
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = {width:video.width, height:video.height};
  faceapi.matchDimensions(canvas, displaySize);
  
  var labeledFaceDesc = await loadLabeledImages();
  console.log(labeledFaceDesc);
  var faceMatcher = new faceapi.FaceMatcher(labeledFaceDesc,0.5);

  setInterval(async () =>{
    if(!recognize){
      
      const detection = await faceapi.detectAllFaces(video,new faceapi.SsdMobilenetv1Options()).withFaceLandmarks();
      const resizedDetection = faceapi.resizeResults(detection,displaySize);
      canvas.getContext("2d").clearRect(0,0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas,resizedDetection);
    
    }else{

      const detection = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptors();
      const resizedDetection = faceapi.resizeResults(detection,displaySize);
      canvas.getContext("2d").clearRect(0,0, canvas.width, canvas.height);
      
      const results = resizedDetection.map(d=>{
        return faceMatcher.findBestMatch(d.descriptor);
      })

      results.forEach((d,i)=>{
        const box = resizedDetection[i].detection.box;
        const drawBox = new faceapi.draw.DrawBox(box,{label:d.toString()});
        drawBox.draw(canvas);
      })

    }
  },100)
}

function recognizeMe(){
  recognize = !recognize;
  console.log("REC:", recognize);
};

function loadLabeledImages(){
  const labels = ["Fabian"];
  return Promise.all(
    labels.map(async label=>{
      var descriptions = [];
      for(let i = 1; i <=5; i++){
        const img = await faceapi.fetchImage('/labeledImages/Fabian/'+i+".jpg");

        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        descriptions.push(detections.descriptor);
      };

      return new faceapi.LabeledFaceDescriptors(label,descriptions);
    })
  );
}