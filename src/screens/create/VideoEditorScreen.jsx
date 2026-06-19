import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { VideoView, useVideoPlayer } from "expo-video";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { SafeAreaView, Text, TextInput, View } from "react-native";

import { FilterStrip } from "../../components/editor/FilterStrip";
import { colors } from "../../constants/theme";
import { filters, noFilter, videoTools } from "./createOptions";
import { EditorHeader } from "./EditorHeader";
import { EditorToolBar } from "./EditorToolBar";
import { TimelineStrip } from "./TimelineStrip";
import { editorStyles as styles } from "./editorStyles";

function getFilterByKey(key) {
  return filters.find((filter) => filter.key === key) || noFilter;
}

export function VideoEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const uri = typeof params.uri === "string" ? params.uri : "";
  const [activeTool, setActiveTool] = useState("trim");
  const [selectedFilter, setSelectedFilter] = useState(
    getFilterByKey(params.filter),
  );
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [overlayText, setOverlayText] = useState("");

  const videoSource = useMemo(() => (uri ? { uri } : null), [uri]);
  const player = useVideoPlayer(videoSource, (nextPlayer) => {
    nextPlayer.loop = true;
    nextPlayer.play();
  });

  function goPreview() {
    router.push({
      pathname: "/preview",
      params: {
        filter: selectedFilter.key,
        mediaType: "video",
        overlayText,
        speed: String(speed),
        trimEnd: String(trimEnd),
        trimStart: String(trimStart),
        uri,
        volume: String(volume),
      },
    });
  }

  function renderPreview() {
    if (!uri) {
      return (
        <View style={styles.emptyPreview}>
          <Ionicons name="videocam-outline" size={44} color={colors.primary} />
          <Text style={styles.emptyTitle}>Video belum dipilih</Text>
          <Text style={styles.emptyText}>
            Ambil video dari tab Add dulu untuk masuk ke editor.
          </Text>
        </View>
      );
    }

    return (
      <>
        <VideoView
          allowsFullscreen
          contentFit="cover"
          nativeControls
          player={player}
          style={styles.previewMedia}
        />
        <View
          pointerEvents="none"
          style={[styles.filterTint, { backgroundColor: selectedFilter.tint }]}
        />
        {overlayText ? (
          <Text numberOfLines={3} style={styles.overlayText}>
            {overlayText}
          </Text>
        ) : null}
      </>
    );
  }

  function renderToolPanel() {
    if (activeTool === "filters") {
      return (
        <FilterStrip
          onSelect={setSelectedFilter}
          selectedKey={selectedFilter.key}
        />
      );
    }

    if (activeTool === "volume") {
      return (
        <>
          <Text style={styles.sliderLabel}>Volume {Math.round(volume * 100)}%</Text>
          <Slider
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={setVolume}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
        </>
      );
    }

    if (activeTool === "speed") {
      return (
        <>
          <Text style={styles.sliderLabel}>Speed {speed.toFixed(1)}x</Text>
          <Slider
            minimumValue={0.5}
            maximumValue={2}
            step={0.25}
            value={speed}
            onValueChange={setSpeed}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
        </>
      );
    }

    if (activeTool === "text") {
      return (
        <TextInput
          value={overlayText}
          onChangeText={setOverlayText}
          placeholder="Tulis overlay video..."
          placeholderTextColor={colors.muted}
          style={styles.textInput}
        />
      );
    }

    return (
      <>
        <Text style={styles.sliderLabel}>
          {activeTool === "split" ? "Split point" : "Trim range"} {trimStart}s -
          {trimEnd}s
        </Text>
        <Slider
          minimumValue={0}
          maximumValue={Math.max(trimEnd - 1, 1)}
          step={1}
          value={trimStart}
          onValueChange={setTrimStart}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
        />
        <Slider
          minimumValue={Math.min(trimStart + 1, 59)}
          maximumValue={60}
          step={1}
          value={trimEnd}
          onValueChange={setTrimEnd}
          minimumTrackTintColor={colors.secondary}
          maximumTrackTintColor={colors.border}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <EditorHeader
          title="Edit Media"
          onBack={() => router.back()}
          onNext={goPreview}
        />
        <View style={styles.previewCard}>{renderPreview()}</View>
        <TimelineStrip startLabel={`00:${String(trimStart).padStart(2, "0")}`} />
        <View style={styles.panel}>{renderToolPanel()}</View>
        <EditorToolBar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          tools={videoTools}
        />
      </View>
    </SafeAreaView>
  );
}
