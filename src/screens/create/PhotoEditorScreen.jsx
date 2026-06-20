import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

import { FilterStrip } from "../../components/editor/FilterStrip";
import { StickerOverlay } from "../../components/editor/StickerOverlay";
import { colors } from "../../constants/theme";
import {
  filters,
  noFilter,
  noSticker,
  photoTools,
  stickerOptions,
} from "./createOptions";
import { EditorHeader } from "./EditorHeader";
import { EditorToolBar } from "./EditorToolBar";
import { editorStyles as styles } from "./editorStyles";
import { applyPhotoFilter } from "../../utils/photoFilters";

function getFilterByKey(key) {
  return filters.find((filter) => filter.key === key) || noFilter;
}

function getStickerByKey(key) {
  return stickerOptions.find((sticker) => sticker.key === key) || noSticker;
}

export function PhotoEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const uri = typeof params.uri === "string" ? params.uri : "";
  const [activeTool, setActiveTool] = useState("filters");
  const [selectedFilter, setSelectedFilter] = useState(
    getFilterByKey(params.filter),
  );
  const [selectedSticker, setSelectedSticker] = useState(
    getStickerByKey(params.sticker),
  );
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

      router.push({
        pathname: "/preview",
        params: {
          brightness: String(brightness),
          contrast: String(contrast),
          filter: selectedFilter.key,
          hasSticker: selectedSticker.key !== noSticker.key ? "true" : "false",
          mediaType: "photo",
          saturation: String(saturation),
          sticker: selectedSticker.key,
          uri: outputUri,
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

  function renderSlider(label, value, onChange) {
    return (
      <>
        <Text style={styles.sliderLabel}>
          {label} {Math.round(value * 100)}
        </Text>
        <Slider
          minimumValue={-1}
          maximumValue={1}
          step={0.05}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
        />
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

    if (activeTool === "sticker") {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stickerRow}
        >
          {[noSticker, ...stickerOptions].map((sticker) => (
            <Pressable
              key={sticker.key}
              onPress={() => setSelectedSticker(sticker)}
              style={[
                styles.stickerOption,
                selectedSticker.key === sticker.key
                  ? styles.stickerOptionActive
                  : null,
              ]}
            >
              {sticker.source ? (
                <Image
                  resizeMode="contain"
                  source={sticker.source}
                  style={styles.stickerOptionImage}
                />
              ) : (
                <Ionicons name="close" size={22} color={colors.primary} />
              )}
              <Text
                style={[
                  styles.stickerOptionText,
                  selectedSticker.key === sticker.key
                    ? styles.stickerOptionTextActive
                    : null,
                ]}
              >
                {sticker.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      );
    }

    if (activeTool === "beauty") {
      return (
        <>
          {renderSlider("Brightness", brightness, setBrightness)}
          {renderSlider("Contrast", contrast, setContrast)}
          {renderSlider("Saturation", saturation, setSaturation)}
        </>
      );
    }

    return null;
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
        <View style={styles.previewCard}>{renderPreview()}</View>
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
