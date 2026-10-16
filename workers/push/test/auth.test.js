import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, SignJWT } from "jose";
import { verifyUser } from "../src/firebase.js";

test("vérifie la signature et refuse un autre projet, un jeton expiré ou une date future", async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const now = Math.floor(Date.now() / 1000);
  const token = async (overrides = {}) => new SignJWT({ auth_time: now - 60, ...overrides })
    .setProtectedHeader({ alg: "RS256" }).setSubject("actor").setIssuer("https://securetoken.google.com/project")
    .setAudience("project").setIssuedAt(now).setExpirationTime(now + 3600).sign(privateKey);
  assert.equal(await verifyUser(await token(), "project", publicKey), "actor");
  await assert.rejects(verifyUser(await token(), "another-project", publicKey), { status: 401 });
  await assert.rejects(verifyUser(await token({ auth_time: now + 100 }), "project", publicKey), { status: 401 });
  const expired = await new SignJWT({ auth_time: now - 60 }).setProtectedHeader({ alg: "RS256" }).setSubject("actor")
    .setIssuer("https://securetoken.google.com/project").setAudience("project").setIssuedAt(now - 60).setExpirationTime(now - 1).sign(privateKey);
  await assert.rejects(verifyUser(expired, "project", publicKey), { status: 401 });
  const wrongKey = await generateKeyPair("RS256");
  await assert.rejects(verifyUser(await token(), "project", wrongKey.publicKey), { status: 401 });
});
