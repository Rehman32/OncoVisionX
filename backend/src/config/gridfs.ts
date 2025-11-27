import mongoose from "mongoose";
import Grid from "gridfs-stream";

export let gfs: Grid.Grid;

export const initGridFS = () => {
  const conn = mongoose.connection;

  // Attach the native MongoDB driver to Grid
  gfs = Grid(conn.db, mongoose.mongo);

  // Set the collection (bucket)
  gfs.collection("uploads");
};
