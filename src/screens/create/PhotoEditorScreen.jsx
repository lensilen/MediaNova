import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FilterStrip } from "../../components/editor/FilterStrip";
import { StickerOverlay } from "../../components/editor/StickerOverlay";
import { colors } from "../../constants/theme";
import { useCreateDraftStore } from "../../store/createDraftStore";
import { filters, getStickerByKey, noFilter, photoTools } from "./createOptions";
import { EditorHeader } from "./EditorHeader";
import { EditorToolBar } from "./EditorToolBar";
import { SaturationSlider } from "./SaturationSlider";
import { editorStyles as styles } from "./editorStyles";
import { applyPhotoFilter } from "../../utils/photoFilters";

function getFilterByKey(key) {
  return filters.find((filter) => filter.key === key) || noFilter;
}

export function PhotoEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { height } = useWindowDimensions();
  const draftId = typeof params.draftId === "string" ? params.draftId : "";
  const storedDraft = useCreateDraftStore((state) =>
    state.drafts[draftId] || state.drafts[state.currentDraftId],
  );
  const updateDraft = useCreateDraftStore((state) => state.updateDraft);
  const uri = storedDraft?.uri || (typeof params.uri === "string" ? params.uri : "");
  const previewHeight = Math.min(390, Math.max(260, height * 0.46));
  const [activeTool, setActiveTool] = useState("filters");
  const [selectedFilter, setSelectedFilter] = useState(
    getFilterByKey(storedDraft?.filter || params.filter),
  );
  const selectedSticker = getStickerByKey(storedDraft?.sticker || params.sticker);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  async function goPreview() {
    if (!uri || isProcessing) return;

    setIsProcessing(true);

    try {
      const outputUri = await applyPhotoFilter(uri, selectedFilter.key, {
        brightness,
        contrast,
        saturation,
      });
      const editMeta = {
        brightness: String(brightness),
        contrast: String(contrast),
        filter: selectedFilter.key,
        mediaType: "photo",
        saturation: String(saturation),
        sticker: selectedSticker.key,
        uri: outputUri,
      };
      const targetDraftId = storedDraft?.id || draftId;

      if (targetDraftId) {
        updateDraft(targetDraftId, {
          editMeta,
          filter: selectedFilter.key,
          sticker: selectedSticker.key,
          type: "photo",
          uri: outputUri,
        });
      }

      router.push({
        pathname: "/preview",
        params: {
          draftId: targetDraftId,
          ...editMeta,
        },
      });
    } catch {
      Alert.alert("Filter gagal", "Coba pilih filter lain atau ulangi dari foto awal.");
    } finally {
      setIsProcessing(false);
    }
  }

  function renderPreview() {
    if (!uri) {
      return (
        <View style={styles.emptyPreview}>
          <Ionicons name="image-outline" size={44} color={colors.primary} />
          <Text style={styles.emptyTitle}>Foto belum dipilih</Text>
          <Text style={styles.emptyText}>
            Ambil foto dari tab Add dulu untuk membuka editor filter.
          </Text>
        </View>
      );
    }

    return (
      <>
        <Image source={{ uri }} resizeMode="cover" style={styles.previewMedia} />
        <View
          pointerEvents="none"
          style={[
            styles.filterTint,
            {
              backgroundColor: selectedFilter.tint,
              opacity: 1 + brightness * 0.15 + saturation * 0.08,
            },
          ]}
        />
        <StickerOverlay sticker={selectedSticker} />
      </>
    );
  }

  function renderSlider(label, value, onChange, colored = false) {
    return (
      <>
        <Text style={styles.sliderLabel}>
          {label} {Math.round(value * 100)}
        </Text>
        {colored ? (
          <SaturationSlider value={value} onChange={onChange} />
        ) : (
          <Slider
            minimumValue={-1}
            maximumValue={1}
            step={0.05}
            value={value}
            onValueChange={onChange}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
        )}
      </>
    );
  }

  function renderPanel() {
    if (activeTool === "filters") {
      return (
        <FilterStrip
          onSelect={setSelectedFilter}
          selectedKey={selectedFilter.key}
        />
      );
    }

    return (
      <>
        {renderSlider("Brightness", brightness, setBrightness)}
        {renderSlider("Contrast", contrast, setContrast)}
        {renderSlider("Saturation", saturation, setSaturation, true)}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <EditorHeader
          title="Edit Foto"
          onBack={() => router.back()}
          onNext={goPreview}
        />
        {isProcessing ? (
          <Text style={styles.metaText}>Memproses filter foto...</Text>
        ) : null}
        <View style={[styles.previewCard, { height: previewHeight }]}>
          {renderPreview()}
        </View>
        <View style={styles.panel}>{renderPanel()}</View>
        <EditorToolBar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          tools={photoTools}
        />
      </View>
    </SafeAreaView>
  );
}
