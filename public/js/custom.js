  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyCyuaRQNmgXJChYp1CLPx3bsYnV1IFRroI",
    authDomain: "test-nnfl.firebaseapp.com",
    databaseURL: "https://test-nnfl.firebaseio.com",
    projectId: "test-nnfl",
    storageBucket: "test-nnfl.appspot.com",
    messagingSenderId: "289418193973"
  };
  firebase.initializeApp(config);

var db = firebase.firestore();

var quesRef = db.collection('questions');
var replyData = {
    count: 0,
    signedIn: false
};

function getQuestions() {

    quesRef.where('pinned', '==', false)
        .get().then((snapshot) => {
            let questions = snapshot.docs;
            populateQuestions(questions);
    })

}

function populateQuestions(questions) {
    let html = '<div class="posts-group"><div class="post-year">Others</div>';
    let data = [];
    questions.forEach((ques, index) => {
        data.push({
            id: ques.id
        });
        data[index].date = new Date(ques.data().timestamp.seconds * 1000).toDateString().substr(4);
        data[index].title = ques.data().title;
        data[index].likes = ques.data().likes;
        data[index].reply_count = ques.data().reply_count;
    });
    html += `<ul class="posts-list">`;
    for (let i in data) {
    html += `   <li class="post-item">
                    <a href="./reply/?id=`+ data[i].id +`">
                        <span class="post-title">`+ data[i].title +`</span>
                        <span>
                            <span>
                                <i class="far fa-thumbs-up"></i>
                                `+ data[i].likes +`
                            </span>
                            <span>
                                <i class="fas fa-reply"></i>
                                `+ data[i].reply_count +`
                            </span>
                            <span class="post-day">`+ data[i].date +`</span>
                        </span>
                    </a>
                </li>`;
    }
    html += '</ul></div>';
    document.getElementById('questions').innerHTML += html;
}



function getPinnedQuestions() {

    quesRef.where('pinned', '==', true)
        .get().then((snapshot) => {
            let questions = snapshot.docs;
            populatePinnedQuestions(questions);
        })

}

function populatePinnedQuestions(questions) {
    let html = '<div class="posts-group"><div class="post-year">Pinned</div>';
    let data = [];
    questions.forEach((ques, index) => {
        data.push({
            id: ques.id
        });
        data[index].date = new Date(ques.data().timestamp.seconds * 1000).toDateString().substr(4);
        data[index].title = ques.data().title;
        data[index].likes = ques.data().likes;
        data[index].reply_count = ques.data().reply_count;
    });
    html += `<ul class="posts-list">`;
    for (let i in data) {
    html += `   <li class="post-item">
                    <a href="./reply/?id=`+ data[i].id +`">
                        <span class="post-title">`+ data[i].title +`</span>
                        <span>
                            <span>
                                <i class="far fa-thumbs-up"></i>
                                `+ data[i].likes +`
                            </span>
                            <span>
                                <i class="fas fa-reply"></i>
                                `+ data[i].reply_count +`
                            </span>
                            <span class="post-day">`+ data[i].date +`</span>
                        </span>
                    </a>
                </li>`;
    }
    html += '</ul></div>';
    document.getElementById('questions').innerHTML += html;
}

function getQuesDetails() {
    let id = new URL(window.location.href).searchParams.get('id');
    quesRef.doc(id)
        .get().then((snapshot) => {
            let question = snapshot.data();
            populateQuesDetails(question);
        })

    let replyRef = quesRef.doc(id).collection('replies');
    replyRef.get().then((snapshot) => {
        let replies = snapshot.docs;
        populateReplies(replies);
    })
}

function populateQuesDetails(question) {
    replyData.count = question.reply_count;
    replyData.likes = question.likes;

    document.getElementById('ques-title').innerHTML = question.title;
    document.getElementById('ques-date').innerHTML = new Date(question.timestamp.seconds * 1000).toString().substr(0, 34);
    document.getElementById('ques-text').innerHTML = marked(question.text);
    document.getElementById('ques-user').innerHTML = question.user;
    document.getElementById('ques-tags').innerHTML = question.tags;
}

function populateReplies(replies) {
    html = '';
    replies.forEach((reply) => {
        let data = reply.data();
        html += `<article class="thin reply">
                    <header class="post-header">
                        <h2 id="reply-title">`+ data.title +`</h2>
                    </header>
                    <div id="reply-text" class="content">
                        `+ marked(data.text) +`
                    </div>
                    <footer class="post-info">
                        <p class="footer-items"><i class="fas fa-user"></i>&nbsp;<span id="reply-user">`+ data.user +`</span></p>
                        <p class="footer-items"><i class="fas fa-calendar"></i></i>&nbsp;<span id="reply-date">`+ new Date(data.timestamp.seconds * 1000).toString().substr(0, 34) +`</span></p>
                    </footer>
                </article>`
    });
    document.getElementById('replies').innerHTML = html;
}

function likeQuestion() {
    let id = new URL(window.location.href).searchParams.get('id');
    quesRef.doc(id).set({
        likes: replyData.likes + 1
    }, { merge: true });
}

function postQuestion() {
    if (!replyData.signedIn) {
        checkAuth();
        return ;
    }
    quesRef.add({
        pinned: false,
        text: document.getElementById('new-text').value,
        timestamp: firebase.firestore.Timestamp.now(),
        title: document.getElementById('new-title').value,
        user: replyData.user,
        reply_count: 0,
        likes: 0,
        tags: ["basics"]
    }).then(() => {
        location.reload();
    })
}

function postReply() {
    if (!replyData.signedIn) {
        checkAuth();
        return ;
    }
    let id = new URL(window.location.href).searchParams.get('id');
    let count = replyData.count + 1;
    let replyRef = quesRef.doc(id).collection('replies');
    replyRef.add({
        pinned: false,
        text: document.getElementById('new-text').value,
        timestamp: firebase.firestore.Timestamp.now(),
        title: document.getElementById('new-title').value,
        user: replyData.user
    }).then((docref) => {
        quesRef.doc(id).set({
        reply_count: count
    }, { merge: true });
    location.reload();
    })
}

function addReply() {
    let visible = document.getElementById('addReply').style.display;
    if (visible != "flex") {
        document.getElementById('addReply').style.display = "flex";
    }
    else {
        document.getElementById('addReply').style.display = "none";
    }
}

function preview() {
    console.log('hey');
    let text = document.getElementById('new-text').value;
    document.getElementById('preview-area').innerHTML = marked(text);
    document.getElementById('preview-title').innerHTML = document.getElementById('new-title').value;
}

var provider = new firebase.auth.GoogleAuthProvider();


function checkAuth() {
    replyData.signedIn = false;
    firebase.auth().signInWithPopup(provider).then(function (result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // ...
        if (user.email.endsWith("bits-pilani.ac.in")) {
            replyData.user = user.email;
            replyData.signedIn = true;
            alert('Logged In Successfully! Submit Now!');
        }
        else {
            firebase.auth().signOut().then(function () {
                alert("Sign In with BITSMail");
            })
        }

    }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(error);
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
        alert("Sign In with BITSMail");
    });
}