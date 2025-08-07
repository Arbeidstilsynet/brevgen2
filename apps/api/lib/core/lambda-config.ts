export function configureLambdaChromium(chromium: typeof import("@sparticuz/chromium").default) {
  if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    throw new Error("@sparticuz/chromium is not available outside of AWS Lambda");
  }

  chromium.setGraphicsMode = false;
}
