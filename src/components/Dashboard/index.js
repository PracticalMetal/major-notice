import React, { useState } from "react";
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
import { mainListItems, secondaryListItems } from "./listItems";
import Chart from "./Chart";
import CountOfDocuments from "./CountOfDocuments";
import ActiveUsers from "./ActiveUsers";

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  boxShadow: "none", // Remove box shadow
  borderBottom: `1px solid ${theme.palette.divider}`, // Add border bottom
  backgroundColor: theme.palette.primary.main, // Change background color
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

// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();

export default function Dashboard({ name, role, organization }) {
  const [open, setOpen] = React.useState(true);
  const navigate = useNavigate();
  const toggleDrawer = () => {
    setOpen(!open);
  };

  const user = auth.currentUser;

  const [image, setImage] = useState(null);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      // Sign-out successful.
      console.log("User signed out");
      navigate("/signin");
    } catch (error) {
      // An error occurred.
      console.error("Error signing out:", error);
    }
  };

  const handleSubmit = async (event) => {
    console.log(user);
    event.preventDefault();
    setImage(event.target[0].files[0]);
    if (!image) return;

    const imageRef = storageRef(storage, `images/${image.name}`);
    const uploadTask = uploadBytesResumable(imageRef, image);
    const currentDate = new Date();
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        console.log(snapshot);
      },
      (error) => {
        alert(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          const userOrgRef = databaseRef(database, `users/${user.uid}`);

          try {
            const orgSnapshot = await get(userOrgRef);
            if (orgSnapshot.exists()) {
              const organization = orgSnapshot.val();
              console.log(organization);
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

                await set(
                  databaseRef(
                    database,
                    "organizations/" + org + `/images/${curImgCount}`
                  ),
                  {
                    imageURL: downloadURL,
                    firstName: firstName,
                    email: email,
                    uid: user.uid,
                    dateofUpload: currentDate,
                  }
                )
                  .then(async () => {
                    const orgRef = databaseRef(
                      database,
                      `organizations/${org}`
                    );
                    await update(orgRef, {
                      imageCount: curImgCount + 1,
                    });
                  })
                  .catch((error) => {});
              }
            } else {
              console.log("Organization not found for user:", user.uid);
            }
          } catch (error) {
            console.error("Error fetching organization:", error);
          }

          console.log("success");
        });
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
              pr: "24px", // keep right padding when drawer closed
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
            <Divider orientation="vertical" flexItem />
            <Chip
              size="small"
              label={role}
              color={role === "admin" ? "error" : "success"}
            />
            <Divider orientation="vertical" flexItem />
            <Box component="form" noValidate onSubmit={handleSubmit}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                sx={{ display: "none" }} // Hide input element
              />
              <Button
                component="label" // Use label component for custom button
                color="inherit"
                variant="text"
                htmlFor="upload-button"
              >
                Upload
              </Button>
              <Button
                type="submit"
                id="upload-button"
                sx={{ display: "none" }} // Hide button element
              />
            </Box>
            
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
              {/* Chart */}
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
              {/* Recent CountOfDocuments */}
              <Grid item xs={12} md={4} lg={3}>
                <Paper
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    height: 240,
                  }}
                >
                  <CountOfDocuments org={organization}/>
                </Paper>
              </Grid>
              {/* Recent ActiveUsers */}
              <Grid item xs={12}>
                <Paper
                  sx={{ p: 2, display: "flex", flexDirection: "column" }}
                >
                  <ActiveUsers org={organization}/>
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
