import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Stack,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

export default function ExamCard({
  exam,
}) {
  const navigate =
    useNavigate();

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardMedia
        component="img"
        height="220"
        image={exam.image}
        alt={exam.title}
      />

      <CardContent
        sx={{
          flex: 1,
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
        >
          {exam.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {exam.description}
        </Typography>

        <Stack
          mt={3}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            variant="h6"
            color="primary"
            fontWeight={700}
          >
            ₦
            {Number(
              exam.amount
            ).toLocaleString()}
          </Typography>

          <Button
            variant="contained"
            onClick={() =>
              navigate(
                exam.route
              )
            }
          >
            Register
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}