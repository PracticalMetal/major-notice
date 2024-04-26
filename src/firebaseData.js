import {database} from "./firebase-config";
import React from "react";
import {ref, onValue} from "firebase/database";
import {useEffect} from "react";

const db = database;

export default function FirebaseData() {
    const [data, setData] = React.useState(null);

    useEffect(() => {
        onValue(ref(db), (snapshot) => {
            setData(snapshot.val());
        });
    }, []);
    return data;

}
