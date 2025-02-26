import { Spinner, SpinnerOverlay } from "@/components/spinner";

export default function Loading() {
  return (
    <SpinnerOverlay>
      <Spinner />
    </SpinnerOverlay>
  );
}
