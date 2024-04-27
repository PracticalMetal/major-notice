import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { ref, set, get } from "firebase/database";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, database } from "../../firebase-config.js";
import { useNavigate } from "react-router-dom";

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="https://msit.in/">
        MSIT
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const theme = createTheme();

export default function SignUp() {
  const [submitBtn, setSubmitBtn] = React.useState(false);

  const [showPassword, setShowPassword] = React.useState(false);
  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = () => setShowPassword(!showPassword);
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  

    if (
      !data.get("firstName") ||
      !data.get("lastName") ||
      !data.get("email") ||
      !data.get("password") ||
      !data.get("organization")
    ) {
      alert("Please fill all the fields");
      return;
    }

    //setting up user with firebase
    setSubmitBtn(true);

    createUserWithEmailAndPassword(
      auth,
      data.get("email"),
      data.get("password")
    )
      .then(async (userCredential) => {
        // Signed in
        const user = userCredential.user;

        // Check if the organization already exists
        const orgRef = ref(database, "organizations/" + data.get("organization"));
        const orgSnapshot = await get(orgRef);

        if (!orgSnapshot.exists()) {
          // If the organization does not exist, create it
          await set(orgRef, {
            imageCount: 0,
          });
        }

        // Add user to database
        await set(ref(database, "users/" + user.uid), {
          firstName: data.get("firstName"),
          lastName: data.get("lastName"),
          email: data.get("email"),
          organization: data.get("organization"),
          uid: user.uid,
          joinedOn:formattedDate,
          role: "admin",
        });

        // Add user to organization
        await set(ref(database, "organizations/" + data.get("organization") + "/users/" + user.uid), {
          email: data.get("email"),
          uid: user.uid,
          firstName: data.get("firstName"),
          lastName: data.get("lastName"),
          joinedOn: formattedDate,
          role: "admin",
        });

        // Update user profile
        await updateProfile(auth.currentUser, {
          displayName: data.get("firstName") + " " + data.get("lastName"),
        });

        setSubmitBtn(false);
        console.log("User added to database");
        navigate("/");
      })
      .catch((error) => {
        setSubmitBtn(false);
        const errorMessage = error.message;
        alert(errorMessage);
      });
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="organization"
                  label="Name of Organization"
                  name="organization"
                  autoComplete="organization"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}></Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disable={submitBtn}
            >
              Sign Up
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link href="/signin" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Copyright sx={{ mt: 5, marginTop: 24 }} />
      </Container>
    </ThemeProvider>
  );
}
