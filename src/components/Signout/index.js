import * as React from "react";
import Button from "@mui/material/Button";
import { auth } from "../../firebase-config.js";

export default function SignOut() {
  return <Button variant="contained" size="small"><a href="/" onClick={() => auth.signOut()}>Sign Out</a></Button>;
}
