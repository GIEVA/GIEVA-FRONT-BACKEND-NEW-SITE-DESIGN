import {
  Paper,
  Typography,
  Stack,
  Avatar,
} from "@mui/material";



const DashboardStatCard =
({

  title,
  value,
  icon,
  color = "#1976d2",

}) => {

  return (

    <Paper

      sx={{

        p: 3,

        borderRadius: 5,

        height: "100%",

        boxShadow:
          "0 8px 30px rgba(0,0,0,0.05)",
      }}
    >

      <Stack
        direction="row"
        justifyContent="space-between"
      >

        <div>

          <Typography
            color="text.secondary"
            mb={1}
          >

            {title}

          </Typography>



          <Typography

            variant="h4"

            fontWeight="bold"
          >

            {value}

          </Typography>

        </div>



        <Avatar

          sx={{

            bgcolor: color,

            width: 56,

            height: 56,
          }}
        >

          {icon}

        </Avatar>

      </Stack>

    </Paper>
  );
};

export default
DashboardStatCard;