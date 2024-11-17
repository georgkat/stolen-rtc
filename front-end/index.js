let localStream;
let remoteStream;
let peerConnection;
let socket;
let makingOffer = false;
let polite = false

let init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  document.getElementById("user-1").srcObject = localStream;
  await connect(createAndSendOffer);
}

let connect = async (callback) => {
  let roomName = window.location.pathname.split("/")[1];
      socket = new WebSocket("wss://63.250.47.203:8001/ws/${roomName}");
  socket.onopen = async (_) =>  {
    await callback()
  };

  socket.onmessage = handleMessage;
};

let handleMessage = async ({ data }) => {
  data = JSON.parse(data);
  if (data["type"] == "USER_JOIN") {
    debugger
    polite = true
    createAndSendOffer();
  }
  if (data["type"] === "OFFER") {
    console.log("received offer")
    handlePerfectNegotiation(data)
  }
  if (data["type"] === "ANSWER") {
    console.log("received answer")
    handlePerfectNegotiation(data)
  }
  if(data["type"] === "candidate") {
    handleIceCandidate(data)
  }
};

let handleOffers = async ({ message }) => {
  await createAndSendAnswer(message);
};

let handleAnswers = async ({ message }) => {
  await peerConnection.setRemoteDescription(message);
};

let handleIceCandidate = async ({ candidate }) => {
  if (peerConnection && peerConnection.remoteDescription) {
    peerConnection.addIceCandidate(candidate);
  }
};

let handlePerfectNegotiation = async ({ message }) => {
  try {
    if (message) {
      const offerCollision =
        message.type === "offer" &&
        (makingOffer || peerConnection.signalingState !== "stable");

      ignoreOffer = !polite && offerCollision;
      if (ignoreOffer) {
        return;
      }

      await peerConnection.setRemoteDescription(message);
      if (message.type === "offer") {
        await peerConnection.setLocalDescription();
        socket.send(JSON.stringify({
          type: "ANSWER",
          message: peerConnection.localDescription,
        }));
      }
    }
  } catch (err) {
    console.error(err);
  }
};

const config = {
  iceServers:
    [
//        {
//        "username": "speaksym3",
//        "credential": "speaksym4",
//        "urls": "turn:speakyourmind.help:3478?transport=udp"
//
//
//        }
            {

      "username": "dc2d2894d5a9023620c467b0e71cfa6a35457e6679785ed6ae9856fe5bdfa269",

      "credential": "tE2DajzSJwnsSbc123",

      "urls": "turn:global.turn.twilio.com:3478?transport=udp"

    },

    {

      "username": "dc2d2894d5a9023620c467b0e71cfa6a35457e6679785ed6ae9856fe5bdfa269",

      "credential": "tE2DajzSJwnsSbc123",

      "urls": "turn:global.turn.twilio.com:3478?transport=tcp"

    },

    {

      "username": "dc2d2894d5a9023620c467b0e71cfa6a35457e6679785ed6ae9856fe5bdfa269",

      "credential": "tE2DajzSJwnsSbc123",

      "urls": "turn:global.turn.twilio.com:443?transport=tcp"

    }

    ],
};


//const config = {
//  iceServers: [
//    {
//      urls: [
//        "stun:stun.l.google.com:19302",
//        "stun:stun.l.google.com:5349",
//        "stun:stun1.l.google.com:3478",
//        "stun:stun1.l.google.com:5349",
//        "stun:stun2.l.google.com:19302",
//        "stun:stun2.l.google.com:5349",
//        "stun:stun3.l.google.com:3478",
//        "stun:stun3.l.google.com:5349",
//        "stun:stun4.l.google.com:19302",
//        "stun:stun4.l.google.com:5349"
//      ],
//    },
//  ],
//};

//const config = {
//  iceServers: [
//    {
//      urls: [
//        "stun:stun.l.google.com:19302",
//        "stun:stun1.l.google.com:19302",
//        "stun:stun1.l.google.com:19302",
//        "stun:stun2.l.google.com:19302",
//      ],
//    },
//  ],
//};

let createStreams = async () => {
  peerConnection = new RTCPeerConnection(config);
  remoteStream = new MediaStream();

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // This function is called each time a peer connects.
  peerConnection.ontrack = (event) => {
    console.log("adding track");
    event.streams[0]
      .getTracks()
      .forEach((track) => remoteStream.addTrack(track));
  };

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      socket.send(
        JSON.stringify({ type: "candidate", candidate: event.candidate })
      );
    }
  };
  peerConnection.onnegotiationneeded = async () => {
    try {
      makingOffer = true;
      await peerConnection.setLocalDescription();
      // signaler.send({ description: pc.localDescription });
      socket.send(
        JSON.stringify({
          type: "OFFER",
          message: peerConnection.localDescription,
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      makingOffer = false;
    }
  };

  document.getElementById("user-2").srcObject = remoteStream;
};

let createAndSendOffer = async () => {
  await createStreams();
  // let offer = await peerConnection.createOffer();
  // await peerConnection.setLocalDescription(offer);

};

// let createAndSendAnswer = async (message) => {
//   await createStreams();
//   await peerConnection.setRemoteDescription(message);
//   let answer = await peerConnection.createAnswer();
//   await peerConnection.setLocalDescription(answer);
//   socket.send(JSON.stringify({ type: "ANSWER", message: answer }));
// };

document.addEventListener(
  "DOMContentLoaded",
  async function () {
    await init();
  },
  false
);
