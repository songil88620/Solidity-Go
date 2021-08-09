import OpenLoginHandler from './OpenLoginHandler'

const createHandler = ({ typeOfLogin, clientId, verifier, redirect_uri, preopenInstanceId, jwtParameters, skipTKey, whiteLabel, loginProvider }) => {
  if (!verifier || !typeOfLogin || !clientId) {
    throw new Error('Invalid params')
  }
  return new OpenLoginHandler({
    clientId,
    verifier,
    redirect_uri,
    typeOfLogin,
    preopenInstanceId,
    jwtParameters,
    skipTKey,
    whiteLabel,
    loginProvider,
  })
}

export default createHandler
