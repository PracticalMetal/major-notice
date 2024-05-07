import React, { useEffect, useState } from 'react';
import { database } from '../../firebase-config.js';
import { ref as databaseRef, get, remove, update } from 'firebase/database';
import Link from '@mui/material/Link';
import PreviewIcon from '@mui/icons-material/Preview';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import DeleteSharpIcon from '@mui/icons-material/DeleteSharp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Title from './Title';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

export default function ActiveUsers({ org }) {
  const [images, setImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [sortOption, setSortOption] = useState('eventDate'); // Default sorting option

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const orgImgRef = databaseRef(database, `organizations/${org}/images`);
        const snapshot = await get(orgImgRef);
        if (snapshot.exists()) {
          const imgData = [];
          snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            imgData.push({
              id: childSnapshot.key, // Get the unique key from Firebase
              uploadedBy: userData.firstName,
              email: userData.email,
              view: userData.imageURL,
              title: userData.title,
              date: userData.dateOfUpload, 
              eventDate: userData.eventDate,
            });
          });

          // Sort images based on the selected option
          imgData.sort((a, b) => {
            if (sortOption === 'eventDate') {
              const dateA = parseDate(a.eventDate);
              const dateB = parseDate(b.eventDate);
              return dateB - dateA;
            } else {
              return new Date(b.date) - new Date(a.date);
            }
          });

          setImages(imgData);
        } else {
          console.log('No users found');
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, [org, sortOption]);

  useEffect(() => {
    const selectedImageId = localStorage.getItem('selectedImageId');
    if (selectedImageId) {
      setSelectedImageId(selectedImageId);
    }
  }, []);

  // Function to parse date string in the format DD/MM/YYYY
  const parseDate = (dateString) => {
    const parts = dateString.split('/');
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Months are zero-based
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  };

  // Function to open imageURL in a new tab
  const openImage = (url) => {
    window.open(url, '_blank');
  };

  const deleteImage = async (id) => {
    try {
      const orgImgRef = databaseRef(database, `organizations/${org}/images/${id}`);
      await remove(orgImgRef);
      setSnackbarMessage('Deletion successful');
      setSnackbarOpen(true);
      // Reload the page
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleSelectImage = async (id) => {
    try {
      const orgImagesRef = databaseRef(database, `organizations/${org}/images`);
      const snapshot = await get(orgImagesRef);
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const imgRef = databaseRef(database, `organizations/${org}/images/${childSnapshot.key}`);
          update(imgRef, {
            priority: childSnapshot.key === id ? true : false
          });
        });
      }

      localStorage.setItem('selectedImageId', id); // Store selected image ID
      setSnackbarMessage('Selection successful');
      setSelectedImageId(id);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleChangeSortOption = (event) => {
    setSortOption(event.target.value);
  };

  return (
    <React.Fragment>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <Title style={{ marginRight: '8px' }}>Document History</Title>
        <Select
          value={sortOption}
          onChange={handleChangeSortOption}
          style={{ marginLeft: 'auto' }}
        >
          <MenuItem value="eventDate">Sort by Event Date</MenuItem>
          <MenuItem value="uploadDate">Sort by Upload Date</MenuItem>
        </Select>
      </div>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Event Date</TableCell>
            <TableCell>Uploaded By</TableCell>
            <TableCell>Uploaded On</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>View</TableCell>
            <TableCell>Select</TableCell>
            <TableCell>Delete</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {images.map((row) => (
            <TableRow key={row.id} style={selectedImageId === row.id ? { backgroundColor: '#90EE90' } : null}>
              <TableCell>{row.title}</TableCell>
              <TableCell>{row.eventDate}</TableCell>
              <TableCell>{row.uploadedBy}</TableCell>
              <TableCell>{row.date}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>
                <Link color="inherit" onClick={() => openImage(row.view)} style={{ cursor: 'pointer' }}>
                  <PreviewIcon />
                </Link>
              </TableCell>
              <TableCell>
                {selectedImageId === row.id ? null : (
                  <Link color="inherit" onClick={() => handleSelectImage(row.id)} style={{ cursor: 'pointer' }}>
                    <CheckCircleIcon />
                  </Link>
                )}
              </TableCell>
              <TableCell>
                <Link color="inherit" onClick={() => deleteImage(row.id)} style={{ cursor: 'pointer' }}>
                  <DeleteSharpIcon />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <MuiAlert elevation={6} variant="filled" onClose={handleSnackbarClose} severity="success">
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </React.Fragment>
  );
}
