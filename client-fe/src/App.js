import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./App.css";
// import { jwtDecode } from "jwt-decode";

function App() {    

  return (
    <div className="App">
      <Router>
        <Header />
        <Routes>
          <Route exact path="/creator" element={<MovieUploadForm />} />
          <Route exact path="/" element={<MovieList />} />
          <Route exact path="/signin" element={<SignIn />} />
          <Route exact path="/signup" element={<SignUp />} />
          <Route exact path="/movie" element={<MoviePlay />} />
        </Routes>
      </Router>
    </div>
  );
}


const MoviePlay = () => {

  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false)

  const playVideo = async (movieUrl, videoElement) => {
    const urls = movieUrl.split(",");
    console.log("Attempting to play video with raw chunks:", urls);

    if (urls.length === 0) {
      alert("No valid video chunks found.");
      return;
    }

    try {
      setIsLoading(true)
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


      setIsLoading(false)
      // Play the video
      videoElement
        .play()
        .catch((err) => console.error("Video playback failed:", err));
    } catch (error) {
      setIsLoading(false)

      console.error("Error during video playback:", error);
      alert("Video playback failed.");
    }
  };


  // console.log({localtion});


  return (
    <div className="movie-play-card">
      Playing movie

      {/* { isLoading ? <Loader/> :  */}

      <video
        className="video"
        poster={''}
        onClick={(e) => playVideo(location.state, e.target)}
      />
      {/* } */}
    </div>
  )
}

const Loader = () => {
  return <span class="loader"></span>
}

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userExists = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : "";
  const onHomepage = location.pathname === "/";
  const userInfo = userExists && jwtDecode(userExists);

  console.log({ userInfo: userInfo.userInfo?.role });

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
      </div>
    </header>
  );
};

const UserInfo = ({ userInfo }) => {
  console.log({ userInfo });
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
  const userExists = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : "";
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/movies")
      .then((response) => response.json())
      .then((data) => {
        setIsLoading(false)
        setApiData(data?.data)
      });
  }, []);

  const playVideo = async (movieUrl, videoElement) => {
    const urls = movieUrl.split(",");
    console.log("Attempting to play video with raw chunks:", urls);

    if (urls.length === 0) {
      alert("No valid video chunks found.");
      return;
    }

    try {
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

      // Play the video
      videoElement
        .play()
        .catch((err) => console.error("Video playback failed:", err));
    } catch (error) {

      console.error("Error during video playback:", error);
      alert("Video playback failed.");
    }
  };

  return (
    // <Loader />
    <div className="movie-list">
      <Loader />
      {isLoading ?

        <Loader /> :
        <div className="video-gallery">
          {apiData.map((data) => (
            <div className="video-card" key={data.movieUrl}>
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
                onClick={() => navigate("/movie", { state: data.movieUrl })}
              >
                Watch Now
              </button>
              {/* )} */}
            </div>
          ))}
        </div>
      }


    </div>
  );
};

const MovieUploadForm = () => {
  const [movieName, setMovieName] = useState("");
  const [movieDescription, setMovieDescription] = useState("");
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false)


  const submitMovieData = (e) => {
    e.preventDefault();
    setIsLoading(true)
    const formData = new FormData();
    formData.append("name", movieName);
    formData.append("description", movieDescription);
    formData.append("image", image[0]);
    formData.append("video", video[0]);

    fetch("/insert-movie", {
      method: "POST",
      body: formData,
    }).then(() => {
      setIsLoading(true)
      navigate("/")
    });
  };

  return (
    <div className="upload-page">
     {isLoading
     ?<Loader/>
      :<form className="upload-form">
        <h1>Upload a Movie</h1>
        <input
          value={movieName}
          onChange={(e) => setMovieName(e.target.value)}
          type="text"
          placeholder="Enter movie name"
          className="input-field"
        />
        <input
          value={movieDescription}
          onChange={(e) => setMovieDescription(e.target.value)}
          type="text"
          placeholder="Enter movie description"
          className="input-field"
        />
        <input
          onChange={(e) => setImage(e.target.files)}
          type="file"
          className="file-input"
        />
        <input
          onChange={(e) => setVideo(e.target.files)}
          type="file"
          className="file-input"
        />
        <button onClick={submitMovieData} className="submit-button">
          Submit
        </button>
      </form>
      }
    </div>
  );
};

const SignIn = () => {
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false)

  const handleLoginClick = (e) => {
    e.preventDefault();

    setIsLoading(true)

    fetch("/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: signinEmail, password: signinPassword }),
    })
      .then((resp) => resp.json())
      .then((jsonResp) => {

        if (jsonResp.token) {
          localStorage.setItem("user", JSON.stringify(jsonResp.token));
          setIsLoading(false)
          navigate("/");
        }
        setIsLoading(false)

      });
  };

  return (
    <div className="auth-page">
      {isLoading
        ? <Loader />
        : <form className="auth-form login-form">
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
            {
              isLoading ? 'Loading....' : 'Login'
            }
          </button>
          <button type="button" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </form>
      }
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
    setIsLoading(true)
    fetch("/signup", {
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
        setIsLoading(false)
      });
  };

  const handleVerifyClick = async (e) => {
    e.preventDefault();
    setIsLoading(true)

    fetch("/verifyOtp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    })
      .then((resp) => resp.json())
      .then((jsonResp) => {
        if (jsonResp.token) {
          localStorage.setItem("user", JSON.stringify(jsonResp.token));
          setIsLoading(false)
          navigate("/");
        }
      });
  };

  return (
    <div className="auth-page">
      {
        isLoading
          ? <Loader />

          : <form className="auth-form signup-form">
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

      }
    </div>
  );
};

export default App;