import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Fab,
  Paper,
  Typography,
  IconButton,
  TextField,
  useTheme,
  alpha,
  Avatar,
  Fade,
  CircularProgress,
} from "@mui/material";
import {
  SmartToyRounded,
  CloseRounded,
  SendRounded,
  PersonRounded,
  AutorenewRounded,
} from "@mui/icons-material";
import services from "@/services";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Chatbot = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Halo! Saya Asisten AI Puskesmas. Ada yang bisa saya bantu terkait prosedur, dokumen, atau cuti?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { role: "user", text: userMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const historyToAPI = messages.filter((m) => m.role !== "system"); // Optional filtering
      const response = await services.ai.chat({
        history: historyToAPI,
        message: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        { role: "model", text: response.data.data },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: "model",
        text: "Sesi chat telah direset. Ada yang bisa saya bantu lagi?",
      },
    ]);
  };

  return (
    <>
      <Fade in={!open}>
        <Fab
          color="secondary"
          aria-label="chat"
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.4)}`,
            "&:hover": {
              transform: "scale(1.05)",
              transition: "transform 0.2s",
            },
          }}
        >
          <SmartToyRounded fontSize="large" />
        </Fab>
      </Fade>

      <Fade in={open}>
        <Paper
          elevation={24}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: { xs: "90vw", sm: 380 },
            height: 550,
            maxHeight: "80vh",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.2)}`,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.secondary.main,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: "white",
                  color: theme.palette.secondary.main,
                  width: 36,
                  height: 36,
                }}
              >
                <SmartToyRounded />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
                  Tanya AI
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Asisten Puskesmas
                </Typography>
              </Box>
            </Box>
            <Box>
              <IconButton size="small" onClick={handleClear} sx={{ color: "white", mr: 1 }}>
                <AutorenewRounded fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "white" }}>
                <CloseRounded />
              </IconButton>
            </Box>
          </Box>

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              overflowY: "auto",
              bgcolor: theme.palette.mode === "dark" ? "background.default" : "#f8fafc",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    flexDirection: isUser ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    gap: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: isUser ? theme.palette.primary.main : theme.palette.secondary.main,
                    }}
                  >
                    {isUser ? (
                      <PersonRounded sx={{ fontSize: 18 }} />
                    ) : (
                      <SmartToyRounded sx={{ fontSize: 18 }} />
                    )}
                  </Avatar>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      maxWidth: "75%",
                      bgcolor: isUser
                        ? theme.palette.primary.main
                        : theme.palette.background.paper,
                      color: isUser ? "white" : theme.palette.text.primary,
                      borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      border: isUser ? "none" : `1px solid ${theme.palette.divider}`,
                      "& p": { m: 0 },
                      "& a": { color: isUser ? "white" : theme.palette.primary.main },
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: "0.875rem",
                        fontFamily: "'Inter', sans-serif",
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                      }}
                    >
                      {isUser ? (
                        msg.text
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      )}
                    </Box>
                  </Paper>
                </Box>
              );
            })}
            {loading && (
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Avatar
                  sx={{ width: 28, height: 28, bgcolor: theme.palette.secondary.main }}
                >
                  <SmartToyRounded sx={{ fontSize: 18 }} />
                </Avatar>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    bgcolor: theme.palette.background.paper,
                    borderRadius: "16px 16px 16px 4px",
                    border: `1px solid ${theme.palette.divider}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <CircularProgress size={16} color="secondary" />
                  <Typography variant="caption" color="text.secondary">
                    AI sedang mengetik...
                  </Typography>
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.background.paper,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "flex-end",
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Tanya sesuatu..."
                variant="outlined"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                multiline
                maxRows={3}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                  },
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <IconButton
                color="secondary"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  borderRadius: "12px",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                  },
                }}
              >
                <SendRounded />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </>
  );
};

export default Chatbot;
