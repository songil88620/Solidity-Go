import deepmerge from "deepmerge";
import jwtDecode from "jwt-decode";

import { LOGIN_TYPE, UX_MODE_TYPE } from "../utils/enums";
import { getVerifierId, loginToConnectionMap, padUrlString } from "../utils/helpers";
import { get } from "../utils/httpHelpers";
import AbstractLoginHandler from "./AbstractLoginHandler";
import { Auth0ClientOptions, Auth0UserInfo, LoginWindowResponse, TorusGenericObject, TorusVerifierResponse } from "./interfaces";

export default class JwtHandler extends AbstractLoginHandler {
  private readonly SCOPE: string = "openid profile email";

  private readonly RESPONSE_TYPE: string = "token id_token";

  private readonly PROMPT: string = "login";

  constructor(
    readonly clientId: string,
    readonly verifier: string,
    readonly redirect_uri: string,
    readonly typeOfLogin: LOGIN_TYPE,
    readonly uxMode: UX_MODE_TYPE,
    readonly redirectToOpener?: boolean,
    readonly jwtParams?: Auth0ClientOptions,
    readonly customState?: TorusGenericObject
  ) {
    super(clientId, verifier, redirect_uri, typeOfLogin, uxMode, redirectToOpener, jwtParams, customState);
    this.setFinalUrl();
  }

  setFinalUrl(): void {
    const { domain } = this.jwtParams;
    const finalUrl = new URL(domain);
    finalUrl.pathname = "/authorize";
    const clonedParams = JSON.parse(JSON.stringify(this.jwtParams));
    delete clonedParams.domain;
    const finalJwtParams = deepmerge(
      {
        state: this.state,
        response_type: this.RESPONSE_TYPE,
        client_id: this.clientId,
        prompt: this.PROMPT,
        redirect_uri: this.redirect_uri,
        scope: this.SCOPE,
        connection: loginToConnectionMap[this.typeOfLogin],
        nonce: this.nonce,
      },
      clonedParams
    );
    Object.keys(finalJwtParams).forEach((key) => {
      if (finalJwtParams[key]) finalUrl.searchParams.append(key, finalJwtParams[key]);
    });
    this.finalURL = finalUrl;
  }

  async getUserInfo(params: LoginWindowResponse): Promise<TorusVerifierResponse> {
    const { idToken, accessToken } = params;
    const { domain, verifierIdField, isVerifierIdCaseSensitive } = this.jwtParams;
    if (accessToken) {
      const domainUrl = new URL(domain);
      const userInfo = await get<Auth0UserInfo>(`${padUrlString(domainUrl)}userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const { picture, name, email } = userInfo;
      return {
        email,
        name,
        profileImage: picture,
        verifierId: getVerifierId(userInfo, this.typeOfLogin, verifierIdField, isVerifierIdCaseSensitive),
        verifier: this.verifier,
        typeOfLogin: this.typeOfLogin,
      };
    }
    if (idToken) {
      const decodedToken = jwtDecode<Auth0UserInfo>(idToken);
      const { name, email, picture } = decodedToken;
      return {
        profileImage: picture,
        name,
        email,
        verifierId: getVerifierId(decodedToken, this.typeOfLogin, verifierIdField, isVerifierIdCaseSensitive),
        verifier: this.verifier,
        typeOfLogin: this.typeOfLogin,
      };
    }
    throw new Error("Access/id token not available");
  }
}
