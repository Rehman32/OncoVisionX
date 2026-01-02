declare module 'spark-md5' {
  const SparkMD5: {
    hash: (message: string | ArrayBuffer) => string;
    ArrayBuffer: {
      hash: (buffer: ArrayBuffer) => string;
    };
  };

  export default SparkMD5;
}
