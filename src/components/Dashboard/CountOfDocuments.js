import React, { useEffect, useState } from 'react';
import { database } from "../../firebase-config.js";
import { ref as databaseRef, get } from "firebase/database";
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Title from './Title';

export default function CountOfDocuments({ org }) {
  const [imageCount, setImageCount] = useState(null);

  useEffect(() => {
    const fetchImageCount = async () => {
      try {
        const orgRef = databaseRef(database, `organizations/${org}`);
        const snapshot = await get(orgRef);
        if (snapshot.exists()) {
          const data = snapshot.val().images;
          const countOfImg = Object.keys(data).length;
          setImageCount(countOfImg);
        } else {
          console.log(`No imageCount found for organization ${org}`);
        }
      } catch (error) {
        console.error('Error fetching imageCount:', error);
      }
    };

    fetchImageCount();
  }, [org]);

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <React.Fragment>
      <Title>Count Of Documents</Title>
      {imageCount !== null ? (
        <Typography component="p" variant="h4">
          {imageCount}
        </Typography>
      ) : (
        <Typography component="p" variant="h4">
          0
        </Typography>
      )}
      <Typography color="text.secondary" sx={{ flex: 1 }}>
        as of {formattedDate}
      </Typography>
      <div>
        <Link color="primary" href="/doc-history">
          View history
        </Link>
      </div>
    </React.Fragment>
  );
}
