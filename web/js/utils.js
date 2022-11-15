function fromWei(val) {
  return web3.utils.fromWei(val);
}

function toWei(val) {
  return web3.utils.toWei(val);
}

async function inputJsonFile(path) {
  try {
    const resp = await fetch(path);
    return await resp.json();
  } catch {
    console.log("error get json:", path);
    return {};
  }
}
