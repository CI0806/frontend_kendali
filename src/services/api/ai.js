import network from "@/utils/network";

const ai = {
  async generateSOP(data) {
    return network.post("/ai/generate-sop", data);
  },
  async chat(data) {
    return network.post("/ai/chat", data);
  },
  async semanticSearch(data) {
    return network.post("/ai/semantic-search", data);
  },
  async polishText(data) {
    return network.post("/ai/polish-text", data);
  }
};

export default ai;
