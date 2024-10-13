const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallButton = document.getElementById('startCall');

let localStream;
let peerConnection;
const signalingServer = new WebSocket('ws://localhost:3000');

// Capture the local video stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    localStream = stream;
  })
  .catch(error => console.error('Error accessing media devices.', error));

// Handle signaling messages from the WebSocket server
signalingServer.onmessage = (message) => {
  const data = JSON.parse(message.data);

  if (data.offer) {
    createAnswer(data.offer);
  } else if (data.answer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  } else if (data.iceCandidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.iceCandidate));
  }
};

// Create an offer to start the call
startCallButton.onclick = () => {
  createOffer();
};

function createOffer() {
  peerConnection = new RTCPeerConnection();

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      signalingServer.send(JSON.stringify({ iceCandidate: event.candidate }));
    }
  };

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.createOffer()
    .then(offer => {
      peerConnection.setLocalDescription(offer);
      signalingServer.send(JSON.stringify({ offer: offer }));
    });
}

function createAnswer(offer) {
  peerConnection = new RTCPeerConnection();
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      signalingServer.send(JSON.stringify({ iceCandidate: event.candidate }));
    }
  };

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.createAnswer()
    .then(answer => {
      peerConnection.setLocalDescription(answer);
      signalingServer.send(JSON.stringify({ answer: answer }));
    });
}
