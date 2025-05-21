import { Grid } from "styled-system/jsx";

export const WikiCardGrid: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <Grid
      gridTemplateColumns={{
        base: "repeat(3, 1fr)",
        lgDown: "repeat(auto-fit, minmax(300px, 1fr))",
      }}
      gap={{
        base: "64px 24px",
        lgDown: "48px",
      }}
    >
      {children}
    </Grid>
  );
};
