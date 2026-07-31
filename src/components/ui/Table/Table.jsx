import { DomainRounded } from '@mui/icons-material';
import {
  Table as BaseTable,
  Box,
  colors,
  LinearProgress,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const Table = ({ columns, data, isLoading }) => {
  if ((!columns || !data || (data.length === 0 && !isLoading)) && !isLoading) {
    return (<Paper
        variant="outlined"
        sx={{
          padding: 6,
          background: colors.grey[50],
          borderRadius: "24px",
          border: `2px dashed ${colors.grey[300]}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}>
        <Box
          sx={{
            background: colors.grey[200],
            p: 2,
            borderRadius: "50%",
            mb: 1,
          }}>
          <DomainRounded sx={{ color: colors.grey[500], fontSize: 40 }} />
        </Box>
        <Typography variant="h6" fontWeight="bold" color="text.secondary">
          Belum ada data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Data akan otomatis muncul di sini setelah Anda menyimpan
          data.
        </Typography>
      </Paper>)
  }

  return (
    <TableContainer component={Paper}>
      {isLoading && <LinearProgress />}
      {isLoading && <LinearProgress />}
      <BaseTable sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.id} align={column.align || 'left'}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              {columns.map((column) => (
                <TableCell key={column.id} align={column.align || 'left'}>
                  {column.render ? column.render(row) : row[column.id]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </BaseTable>
    </TableContainer>
  );
};

export default Table;
