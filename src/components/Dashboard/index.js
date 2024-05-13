import React, { useState, useRef, useEffect } from "react";
import Tesseract from "tesseract.js";
import { useNavigate } from "react-router-dom";
import { auth, database, storage } from "../../firebase-config.js";
import { ref as databaseRef, get, set, update } from "firebase/database";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import MuiAppBar from "@mui/material/AppBar";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { mainListItems } from "./listItems";
import Chart from "./Chart";
import CountOfDocuments from "./CountOfDocuments";
import ActiveUsers from "./ActiveUsers";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

// Define drawer width and default theme

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  boxShadow: "none",
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.primary.main,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

const defaultTheme = createTheme();

// Main function component

export default function Dashboard({ name, role, organization }) {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const user = auth.currentUser;

  // State variables for image upload and OCR

  const [image, setImage] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [info, setInfo] = useState("")
  const [uploading, setUploading] = useState(false); // State for upload status
  const [uploadSuccess, setUploadSuccess] = useState(false); // State for upload success

  // Function to handle sign-out

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      console.log("User signed out");
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Ref for file input

  const fileInput = useRef(null);

  // Function to handle form submission (image upload and OCR)

  const handleSubmit = async (event) => {
    event.preventDefault();
    setUploading(true);
    const uploadedImage = fileInput.current.files[0];
    if (!uploadedImage) {
      console.error("No image selected for upload");
      return;
    }

    try {
      const result = await Tesseract.recognize(uploadedImage, "eng", {
        logger: (m) => console.log(m),
      });
      const text = result.data.text;
      console.log("Recognized text:", text);

      const lines = text.split("\n");
      let foundNoticeDate = false;
      let heading = "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!foundNoticeDate && line.startsWith("Date: ")) {
          foundNoticeDate = true;
        } else if (foundNoticeDate) {
          console.log(line)
          heading = line;
          break;
        }
      }

      foundNoticeDate = false;

      for (let i = 0; i < lines.length; i++) {
        const line1 = lines[i].trim();
        if (!foundNoticeDate && line1.startsWith("Date of Event: ")) {
          foundNoticeDate = true;
          console.log(line1)
          const prefix = "Date of Event: ";
          const dateIndex = line1.indexOf(prefix) + prefix.length;
          const date = line1.substring(dateIndex).trim();
          setEventDate(date)
        } else if (foundNoticeDate) {
          break;
        }
      }

      foundNoticeDate= false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!foundNoticeDate && line===heading) {
          foundNoticeDate = true;
        } else if (foundNoticeDate) {
          const nextLine = lines[i + 1]?.trim();
          const concatenatedLine = line + (nextLine ? " " + nextLine : "");
          setInfo(concatenatedLine.slice(0,125));
          break;
        }
      }

      setTitle(heading);
      setRecognizedText(text);

      // Set recognized text and image state
      setRecognizedText(text);
      setImage(uploadedImage);
    } catch (error) {
      console.error("Error recognizing text:", error);
    }
  };

  useEffect(() => {
    if (image) {
      try {
        const imageRef = storageRef(storage, `images/${image.name}`);
        const uploadTask = uploadBytesResumable(imageRef, image);

        // Attach event listeners for state changes, errors, and completion
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Progress tracking logic can be added here if needed
            // console.log("Upload progress: ", (snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          },
          (error) => {
            // Handle upload errors
            console.error("Upload error:", error);
            // Reset uploading state to false
            setUploading(false);
            // Reset upload success state to false
            setUploadSuccess(false);
          },
          async () => {
            // Upload completed successfully
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const userOrgRef = databaseRef(database, `users/${user.uid}`);

              // Process uploaded image data
              if (image) {
                // Update database with image details
                const orgSnapshot = await get(userOrgRef);
                if (orgSnapshot.exists()) {
                  const organization = orgSnapshot.val();
                  const firstName = organization.firstName;
                  const org = organization.organization;
                  const email = organization.email;

                  const curCount = databaseRef(
                    database,
                    `organizations/${org}/imageCount`
                  );
                  const curCountSnapshot = await get(curCount);

                  if (curCountSnapshot.exists()) {
                    const curImgCount = curCountSnapshot.val();
                    function formatDateToISO(date) {
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                    
                      return `${day}-${month}-${year}`;
                    }
                    
                    const date = new Date();
                    const formattedDate = formatDateToISO(date);
                    

                    

                    // Generate a unique identifier for the image
                    const uniqueID = Date.now(); // You can use any other unique identifier generation method
                    const dateNew=new Date();
                    const currentMonth=dateNew.getMonth();

                    await set(
                      databaseRef(
                        database,
                        `organizations/${org}/images/${uniqueID}`
                      ),
                      {
                        id: uniqueID,
                        priority: false,
                        imageURL: downloadURL,
                        firstName: firstName,
                        email: email,
                        uid: user.uid,
                        dateOfUpload: formattedDate,
                        title: title,
                        info: info,
                        eventDate: eventDate,
                      }
                    ).then(async () => {
                      const orgRef = databaseRef(
                        database,
                        `organizations/${org}/${currentMonth}/${uniqueID}`
                      );
                      await set(orgRef, {
                        id: uniqueID,
                        priority: false,
                        imageURL: downloadURL,
                        firstName: firstName,
                        email: email,
                        uid: user.uid,
                        dateOfUpload: formattedDate,
                        title: title,
                        info: info,
                        eventDate: eventDate,
                      });
                    });
                  }
                } else {
                  console.log("Organization not found for user:", user.uid);
                }

                
                console.log("Upload success");
                // Set upload success state to true
                setUploadSuccess(true);
              }
            } catch (error) {
              console.error("Error:", error);
              // Reset uploading state to false
              setUploading(false);
              // Reset upload success state to false
              setUploadSuccess(false);
            } finally {
              // Reset uploading state to false
              setUploading(false);
            }
          }
        );

        // Set uploading state to true to indicate the start of upload
        setUploading(true);
      } catch (error) {
        console.error("Error starting upload:", error);
        // Reset uploading state to false on error
        setUploading(false);
        // Reset upload success state to false on error
        setUploadSuccess(false);
      }
    }
  }, [image]);

  // useEffect to reload the page and display Snackbar on upload success
  useEffect(() => {
    if (uploadSuccess) {
      // Reload the page after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [uploadSuccess]);

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: "24px",
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: "36px",
                ...(open && { display: "none" }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Link
                href="#"
                color="inherit"
                underline="none"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <img src="/image.png" alt="Logo" height="35" />
                <Box ml={1}>Dashboard</Box>
              </Link>
            </Typography>
            <Chip
              size="small"
              label={role}
              color={role === "admin" ? "error" : "success"}
            />
            <Button
              variant="contained"
              color="success"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ ml: 2 }}
              disabled={uploading} // Disable button when uploading
            >
              <input
                type="file"
                hidden
                ref={fileInput}
                onChange={handleSubmit}
              />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List component="nav">{mainListItems}</List>
          <Divider />
          <Button color="inherit" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Drawer>
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8} lg={9}>
                <Paper
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    height: 240,
                  }}
                >
                  <Chart />
                </Paper>
              </Grid>
              <Grid item xs={12} md={4} lg={3}>
                <Paper
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    height: 240,
                  }}
                >
                  <CountOfDocuments org={organization} />
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper
                  sx={{ p: 2, display: "flex", flexDirection: "column" }}
                >
                  <ActiveUsers org={organization} />
                </Paper>
              </Grid>
            </Grid>
            <Box sx={{ pt: 4 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
              >
                {name} © {new Date().getFullYear()} -{" "}
                <Link color="inherit" href="https://msit.in/">
                  MSIT
                </Link>
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>
      {/* Snackbar for Upload Successful */}
      <Snackbar
        open={uploadSuccess}
        autoHideDuration={6000}
        onClose={() => setUploadSuccess(false)}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setUploadSuccess(false)}
          severity="success"
        >
          Upload Successful
        </MuiAlert>
      </Snackbar>
    </ThemeProvider>
  );
}
