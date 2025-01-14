import { Violation } from "./Violation.js";

export type ScanResult = {
  status: number;
  summary: {
    flowsNumber: number;
    results: number;
    message: string;
  };
  results: Violation[];
};
