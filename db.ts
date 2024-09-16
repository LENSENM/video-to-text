import React from 'react';
import { Dexie } from 'dexie';

export interface fileData {
    id?: number;
    name: string;
    type: string;
    data: File
}

const createFileDexie = () => {

    const db = new Dexie('myDatabase');

    db.version(1).stores({
        files: '++id, name, type, data' // Primary key and indexed props
    });

    return db;
};

export const dbFileDexie = createFileDexie();