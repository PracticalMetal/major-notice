import React, { useState } from "react";
import Tesseract from "tesseract.js";

import { useNavigate } from "react-router-dom";
import { auth, database, storage } from "../../firebase-config.js";
import {
  ref as databaseRef,
  get,
  set,
  update
} from "firebase/database";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable
} from "firebase/storage";
import { 
  styled,
  createTheme,
  ThemeProvider 
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import MuiAppBar from "@mui/material/AppBar";
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
import ActiveUsers from "./ActiveUsers";

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open"
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  boxShadow: "none", // Remove box shadow
  borderBottom: `1px solid ${theme.palette.divider}`, // Add border bottom
  backgroundColor: theme.palette.primary.main, // Change background color
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  })
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open"
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9)
      }
    })
  }
}));

const defaultTheme = createTheme();

export default function Dashboard({ name, role, organization }) {
  const [open, setOpen] = React.useState(true);
  const navigate = useNavigate();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const user = auth.currentUser;

  const [image, setImage] = useState(null);
  const [title, setTitle]=useState("");
  const [eventDate, setEventDate]=useState("");
  const [recognizedText, setRecognizedText] = useState("");

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      console.log("User signed out");
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setImage(event.target[0].files[0]);
    if (!image) return;
  
    const imageRef = storageRef(storage, `images/${image.name}`);
    const uploadTask = uploadBytesResumable(imageRef, image);
  
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        console.log(snapshot);
      },
      (error) => {
        alert(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const userOrgRef = databaseRef(database, `users/${user.uid}`);
  
          console.log(downloadURL);
  
          if (image) {
            const result = await Tesseract.recognize(image, "eng", {
              logger: (m) => console.log(m),
            });
            const text = result.data.text;
  
            const datePattern = /Date of Event: (\d{2}\/\d{2}\/\d{4})/;
  
            // Match the date pattern in the text
            const matches = text.match(datePattern);
            if (matches) {
              // Extract the date string
              const date = matches[1];
              setEventDate(date);
            } else {
              console.log("Date not found in the text.");
            }
  
            const lines = text.split("\n");
  
            // Flag to indicate whether we've found the date following "Notice"
            let foundNoticeDate = false;
  
            // Initialize variables to store the heading and date of event
            let heading = "";
  
            // Iterate over each line
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim(); // Remove leading and trailing whitespace
  
              // Check if the line contains the date following "Notice"
              if (!foundNoticeDate && line.startsWith("Date: ")) {
                foundNoticeDate = true;
              } else if (foundNoticeDate) {
                // If we've found the date following "Notice", extract the heading from the next line
                heading = line;
                break; // Stop iterating once we've found the heading
              }
            }
  
            // Output the result
            setTitle(heading);
            setRecognizedText(result.data.text);
          }
  
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
              const currentDate = new Date();
              const formattedDate = currentDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
  
              await set(
                databaseRef(
                  database,
                  `organizations/${org}/images/${curImgCount}`
                ),
                {
                  imageURL: downloadURL,
                  firstName: firstName,
                  email: email,
                  uid: user.uid,
                  dateOfUpload: formattedDate,
                  title: title,
                  eventDate: eventDate,
                }
              ).then(async () => {
                const orgRef = databaseRef(
                  database,
                  `organizations/${org}`
                );
                await update(orgRef, {
                  imageCount: curImgCount + 1,
                });
              });
            }
          } else {
            console.log("Organization not found for user:", user.uid);
          }
  
          console.log("success");
        } catch (error) {
          console.error("Error:", error);
        }
      }
    );
  };
  

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: "24px" // keep right padding when drawer closed
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: "36px",
                ...(open && { display: "none" })
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
                alignItems: "center"
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
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: [1]
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
            overflow: "auto"
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              {/* Recent ActiveUsers */}
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
    </ThemeProvider>
  );
}
