const safeJsonParse = (s: string) =>{
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export default safeJsonParse;