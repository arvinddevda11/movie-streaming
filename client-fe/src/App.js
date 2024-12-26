import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./App.css";
import { useRazorpay, RazorpayOrderOptions } from "react-razorpay";

function App() {
  return (
    <div className="App">
      <Router>
        <Header />
        <Routes>
          <Route exact path="/" element={<MovieList />} />
          <Route exact path="/signup" element={<SignUp />} />
          <Route exact path="/signin" element={<SignIn />} />
          <Route exact path="/creator" element={<MovieUploadForm />} />
          <Route exact path="/movie" element={<MoviePlay />} />
        </Routes>
      </Router>
    </div>
  );
}

const MoviePlay = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaybackReady, setIsPlaybackReady] = useState(false);
  const videoElementRef = useRef("");
  const userExists = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : "";

  const playVideo = async (movieUrl, videoElement) => {
    const urls = movieUrl.split(",");
    console.log(
      "Attempting to play video with raw chunks:",
      urls,
      videoElement
    );
    if (urls.length === 0) {
      alert("No valid video chunks found.");
      return;
    }
    try {
      setIsLoading(true);
      // Fetch all chunks as binary data
      const chunkBlobs = await Promise.all(
        urls.map(async (url, index) => {
          try {
            console.log(`Fetching chunk ${index + 1}: ${url}`);
            const response = await fetch(url);
            if (!response.ok)
              throw new Error(`Failed to fetch chunk ${index + 1}`);
            return await response.blob(); // Convert chunk to Blob
          } catch (error) {
            console.error(`Error fetching chunk ${index + 1}:`, error);
            throw error;
          }
        })
      );
      console.log("All chunks fetched. Concatenating chunks...");
      // Concatenate all chunks into a single Blob
      const combinedBlob = new Blob(chunkBlobs, { type: "video/mp4" });
      // Create a URL for the concatenated Blob and set it as the video source
      const videoUrl = URL.createObjectURL(combinedBlob);
      videoElement.src = videoUrl;
      videoElement.controls = true;
      setIsLoading(false);
      // Play the video
      setIsPlaybackReady(true);
      videoElement
        .play()
        .catch((err) => console.error("Video playback failed:", err));
    } catch (error) {
      setIsLoading(false);
      console.error("Error during video playback:", error);
      alert("Video playback failed.");
    }
  };

  return (
    <div className="movie-play-card">
      {userExists ? (
        <div
          className="video-elem"
          onClick={(e) =>
            isPlaybackReady
              ? ""
              : playVideo(location.state.movieUrl, videoElementRef.current)
          }
        >
          <video
            className="video"
            poster={isPlaybackReady ? "" : location.state.thumbnailUrl}
            controls={isPlaybackReady}
            ref={videoElementRef}
          />
          {isLoading ? (
            <Loader />
          ) : isPlaybackReady ? (
            <></>
          ) : (
            <button className="watch-now-button">Play Video</button>
          )}
        </div>
      ) : (
        <Navigate to={"/"} />
      )}
    </div>
  );
};

const Loader = () => {
  return <span className="loader"></span>;
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userExists = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : "";
  const onHomepage = location.pathname === "/";
  const userInfo = userExists && jwtDecode(userExists);
  const { Razorpay } = useRazorpay();

  const createPayment = async () => {


  const response = await fetch(`https://movie-streaming-120a.onrender.com/create-payment`,{
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify({
      userId: userInfo._id, 
      amount: 500
    })
  })

  

  const data = await response.json();

  
  
  if (data) {

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY,
      amount: data.amount,
      currency: data.currency,
      name: "My Movie Platform",
      description: "Subscription Payment",
      image: "/logo.png",
      order_id: data.orderId,
      handler: async (response) => {
        console.log("Payment Successful:", response);
        const res = await fetch(`https://movie-streaming-120a.onrender.com/verify-subscription-payment`,{
          headers: { "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify({
            userId: userInfo._id, 
            razorpay_payment_id: response.razorpay_payment_id, 
            razorpay_order_id: response.razorpay_order_id, 
            razorpay_signature: response.razorpay_signature
          })
        })



        alert("Payment Successful!", res);
      },
      prefill: {
        name: userInfo?.name || "User",
        email: userInfo?.email || "user@example.com",
        contact: "1234567890",
      },
      notes: {
        subscription_type: "Premium",
      },
      theme: {
        color: "#e50914",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      console.error("Payment Failed:", response);
      alert("Payment Failed. Please try again.");
    });
    

    rzp.open();
    
    
    }
  };

  console.log({userInfo: userInfo.isSubscibed});
  

  return (
    <header className="header">
      {!onHomepage && (
        <button className="back-button" onClick={() => navigate(-1)}>
          Back
        </button>
      )}
      <h1 className="header-title">My Movie Platform</h1>
      <div className="header-actions">
        {userExists ? (
          <UserInfo userInfo={userInfo} />
        ) : (
          <button onClick={() => navigate("/signin")} className="header-button">
            Login
          </button>
        )}

        {userInfo?.role === "Admin" ? (
          <button
            onClick={() => navigate("/creator")}
            className="header-button"
          >
            Upload
          </button>
        ) : (
          <></>
        )}

        {/* Subscribe Button */}
        {userExists && !userInfo.isSubscibed && (
          <button onClick={() => createPayment()} className="header-button">
            Subscribe
          </button>
        )}
      </div>
    </header>
  );
};

const UserInfo = ({ userInfo }) => {
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <div className="user-info">
      <div className="user-avatar" />
      <div className="user-data">
        <div className="username">{userInfo.username}</div>
        <div className="useremail">{userInfo.email}</div>
      </div>
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
};

const MovieList = () => {
  const navigate = useNavigate();
  const [apiData, setApiData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const userExists = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : "";

  useEffect(() => {
    fetch(`https://movie-streaming-120a.onrender.com/movies`)
      .then((response) => response.json())
      .then((data) => {
        setIsLoading(false);
        setApiData(data?.data);
      });
  }, []);

  const user = userExists && jwtDecode(userExists);

  return (
    // <Loader />
    <div className="movie-list">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="video-gallery">
          {apiData.map((data) => (
            <div
              className={`video-card ${data.isPaid ? "paid-movie" : ""}`}
              key={data.movieUrl}
            >
              <video
                className="video"
                poster={data.thumbnailUrl}
                // onClick={(e) => playVideo(data.movieUrl, e.target)}
              />
              <div className="movie-info">
                <h3 className="movie-title">{data.movieName}</h3>
                <p className="movie-description">{data.movieDescription}</p>
              </div>
              {/* {!userExists && ( */}
              <button
                className="watch-now-button"
                onClick={() => {
                  if (data.isPaid && !user.isSubscibed) {
                    alert("Please subscribe to watch this movie");
                    return;
                  }
                  userExists
                    ? navigate("/movie", { state: data })
                    : navigate("/signin");
                }}
              >
                {data.isPaid && !user.isSubscibed
                  ? "Subscribe now"
                  : "Watch Now"}
              </button>
              {/* )} */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MovieUploadForm = () => {
  const [movieName, setMovieName] = useState("");
  const [movieDescription, setMovieDescription] = useState("");
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const userExists = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : "";
  const [isPaid, setIsPaid] = useState(false);

  const navigate = useNavigate();

  const submitMovieData = (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData();
    formData.append("name", movieName);
    formData.append("description", movieDescription);
    formData.append("image", image[0]);
    formData.append("video", video[0]);
    formData.append("isPaid", isPaid);

    fetch(`https://movie-streaming-120a.onrender.com/insert-movie`, {
      method: "POST",
      body: formData,
    }).then(() => {
      setIsLoading(false);
      navigate("/");
    });
  };

  return (
    <>
      {userExists ? (
        <div className="upload-page">
          {isLoading ? (
            <Loader />
          ) : (
            <form className="upload-form">
              <h1>Upload a Movie</h1>

              {/* Movie Name */}
              <label htmlFor="movieName" className="form-label">
                Movie Name
              </label>
              <input
                id="movieName"
                value={movieName}
                onChange={(e) => setMovieName(e.target.value)}
                type="text"
                placeholder="Enter movie name"
                className="input-field"
              />

              {/* Movie Description */}
              <label htmlFor="movieDescription" className="form-label">
                Movie Description
              </label>
              <input
                id="movieDescription"
                value={movieDescription}
                onChange={(e) => setMovieDescription(e.target.value)}
                type="text"
                placeholder="Enter movie description"
                className="input-field"
              />

              {/* Image Upload */}
              <label htmlFor="imageUpload" className="form-label">
                Upload Image
              </label>
              <input
                id="imageUpload"
                onChange={(e) => setImage(e.target.files)}
                type="file"
                className="file-input"
              />

              {/* Video Upload */}
              <label htmlFor="videoUpload" className="form-label">
                Upload Video
              </label>
              <input
                id="videoUpload"
                onChange={(e) => setVideo(e.target.files)}
                type="file"
                className="file-input"
              />

              {/* Is Paid Movie */}
              <fieldset className="form-group">
                <legend>Is this a paid movie?</legend>
                <label htmlFor="paidTrue" className="form-radio-label">
                  <input
                    id="paidTrue"
                    name="isPaid"
                    type="radio"
                    value="true"
                    onChange={(e) => setIsPaid(true)}
                    className="radio-input"
                  />
                  Yes
                </label>
                <label htmlFor="paidFalse" className="form-radio-label">
                  <input
                    id="paidFalse"
                    name="isPaid"
                    type="radio"
                    value="false"
                    onChange={(e) => setIsPaid(false)}
                    className="radio-input"
                  />
                  No
                </label>
              </fieldset>

              {/* Submit Button */}
              <button onClick={submitMovieData} className="submit-button">
                Submit
              </button>
            </form>
          )}
        </div>
      ) : (
        <Navigate to={"/"} />
      )}
    </>
  );
};

const SignIn = () => {
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginClick = (e) => {
    e.preventDefault();

    setIsLoading(true);

    fetch(`https://movie-streaming-120a.onrender.com/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: signinEmail, password: signinPassword }),
    })
      .then((resp) => resp.json())
      .then((jsonResp) => {
        if (jsonResp.token) {
          localStorage.setItem("user", JSON.stringify(jsonResp.token));
          setIsLoading(false);
          navigate("/");
        }
        setIsLoading(false);
      });
  };

  return (
    <div className="auth-page">
      {isLoading ? (
        <Loader />
      ) : (
        <form className="auth-form login-form">
          <h2>Login</h2>
          <input
            value={signinEmail}
            onChange={(e) => setSigninEmail(e.target.value)}
            type="text"
            placeholder="Email"
            className="input-field"
          />
          <input
            value={signinPassword}
            onChange={(e) => setSigninPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="input-field"
          />
          <button onClick={handleLoginClick} className="auth-button">
            {isLoading ? "Loading...." : "Login"}
          </button>
          <button type="button" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </form>
      )}
    </div>
  );
};

const SignUp = () => {
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState();
  const navigate = useNavigate();
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignupClick = (e) => {
    e.preventDefault();
    setIsLoading(true);
    fetch(`https://movie-streaming-120a.onrender.com/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })
      .then((resp) => resp.json())
      .then((jsonResp) => {
        if (jsonResp.token) {
          setIsOtpSent(true);
          localStorage.setItem("user", JSON.stringify(jsonResp.token));
        }
        setIsLoading(false);
      });
  };

  const handleVerifyClick = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    fetch(`https://movie-streaming-120a.onrender.com/verifyOtp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    })
      .then((resp) => resp.json())
      .then((jsonResp) => {
        if (jsonResp.token) {
          localStorage.setItem("user", JSON.stringify(jsonResp.token));
          setIsLoading(false);
          navigate("/");
        }
        setIsLoading(false);
      });
  };

  return (
    <div className="auth-page">
      {isLoading ? (
        <Loader />
      ) : (
        <form className="auth-form signup-form">
          <h2>Sign Up</h2>
          <input
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            type="text"
            placeholder="Username"
            className="input-field"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="text"
            placeholder="Email"
            className="input-field"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="input-field"
          />
          <button onClick={handleSignupClick} className="auth-button">
            Send Otp
          </button>
          {isOtpSent && (
            <>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                type="number"
                placeholder="OTP"
                className="input-field"
              />
              <button onClick={handleVerifyClick} className="auth-button">
                Verify Otp
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
};

export default App;