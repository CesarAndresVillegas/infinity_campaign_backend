import { json } from "../../lib/http.js";
import * as countries from "../../models/countries.js";

export async function listCountries() {
  const rows = await countries.listActiveCountries();
  return json(200, rows);
}
