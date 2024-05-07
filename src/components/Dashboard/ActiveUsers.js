import React, { useEffect, useState } from 'react';
import { database } from '../../firebase-config.js';
import { ref as databaseRef, get } from 'firebase/database';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import AddCircleSharpIcon from '@mui/icons-material/AddCircleSharp';
import DeleteSharpIcon from '@mui/icons-material/DeleteSharp';
import Title from './Title';

function preventDefault(event) {
  event.preventDefault();
}

export default function ActiveUsers({ org }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const orgUsersRef = databaseRef(database, `organizations/${org}/users`);
        const snapshot = await get(orgUsersRef);
        if (snapshot.exists()) {
          const usersData = [];
          snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            usersData.push({
              id: userData.uid,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              role: userData.role,
              joinedOn: userData.joinedOn,
            });
          });

          // Sort usersData array by role, with 'admin' role appearing first
          usersData.sort((a, b) => {
            if (a.role === 'admin') return -1;
            if (b.role === 'admin') return 1;
            return 0;
          });

          setUsers(usersData);
        } else {
          console.log('No users found');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [org]); // Dependency on 'org' to fetch data when the organization changes

  return (
    <React.Fragment>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Title style={{ marginRight: '8px' }}>Active Users</Title>
        <Link color="primary" href="#" onClick={preventDefault}>
          <AddCircleSharpIcon size="small" />
        </Link>
      </div>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>First Name</TableCell>
            <TableCell>Last Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Joined On</TableCell>
            <TableCell>Role</TableCell>
            {/* <TableCell>Delete</TableCell> */}
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.firstName}</TableCell>
              <TableCell>{row.lastName}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.joinedOn}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={row.role}
                  color={row.role === 'admin' ? 'error' : 'success'}
                />
              </TableCell>
              {/* <TableCell>
                <Link color="inherit" href="#" onClick={preventDefault}>
                  <DeleteSharpIcon />
                </Link>
              </TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </React.Fragment>
  );
}
