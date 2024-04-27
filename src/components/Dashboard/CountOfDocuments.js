import React,{useEffect, useState} from 'react';
import {database } from "../../firebase-config.js";
import { ref as databaseRef, get } from "firebase/database";


import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Title from './Title';

function preventDefault(event) {
  event.preventDefault();
}

export default function CountOfDocuments({org}) {


  const [imageCount, setImageCount] = useState(null);

  useEffect(() => {
    const fetchImageCount = async () => {
      try {
        // Construct the database reference to the "organizations/{org}" node
        const orgRef = databaseRef(database, `organizations/${org}`);
        // Fetch the imageCount value from the database
        const snapshot = await get(orgRef);
        if (snapshot.exists()) {
          // Set the imageCount state
          setImageCount(snapshot.val().imageCount);
        } else {
          console.log(`No imageCount found for organization ${org}`);
        }
      } catch (error) {
        console.error('Error fetching imageCount:', error);
      }
    };

    fetchImageCount();
  }, [org, imageCount]); // Run the effect whenever the org prop changes


  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });


  return (
    <React.Fragment>
      <Title>Count Of Documents</Title>
      <Typography component="p" variant="h4">
        {imageCount}
      </Typography>
      <Typography color="text.secondary" sx={{ flex: 1 }}>
        as of {formattedDate}
      </Typography>
      <div>
        <Link color="primary" href="#" onClick={preventDefault}>
          View history
        </Link>
      </div>
    </React.Fragment>
  );
}