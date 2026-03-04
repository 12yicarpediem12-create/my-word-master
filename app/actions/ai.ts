const handleAIGenerate = async () => {
    if (!newWord.trim()) return;
    setIsGenerating(true);
    try {
      const aiData = await generateWordDetails(newWord, selectedLang);
      
      // 🌟 エラーチェックを追加
      if (aiData && !aiData.error) {
        setNewTranslation(aiData.translation || "");
        setNewPos(aiData.part_of_speech || "");
        setNewExample(aiData.example_sentence || "");
        setNewExampleTranslation(aiData.example_translation || "");
        setNewCategory(aiData.category || "Other");
        setNewConjugation(aiData.conjugation || "");
      } else {
        // エラー時はアラートを出し、ステートの更新をスキップ
        alert(aiData?.error || "AI Generation failed.");
      }
    } catch (error) {
      console.error("Client Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };