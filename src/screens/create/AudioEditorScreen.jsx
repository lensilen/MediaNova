import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { colors } from "../../constants/theme";
import { useCreateDraftStore } from "../../store/createDraftStore";
import { processAudioEdit } from "../../utils/mediaProcessing";
import { audioTools, formatTime, waveformBars } from "./createOptions";
import { EditorHeader } from "./EditorHeader";
import { EditorToolBar } from "./EditorToolBar";
import { editorStyles as styles } from "./editorStyles";

export function AudioEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { height } = useWindowDimensions();
  const draftId = typeof params.draftId === "string" ? params.draftId : "";
  const storedDraft = useCreateDraftStore((state) =>
    state.drafts[draftId] || state.drafts[state.currentDraftId],
  );
  const updateDraft = useCreateDraftStore((state) => state.updateDraft);
  const uri = storedDraft?.uri || (typeof params.uri === "string" ? params.uri : "");
  const previewHeight = Math.min(300, Math.max(220, height * 0.32));
  const [activeTool, setActiveTool] = useState("trim");
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const source = useMemo(() => uri || null, [uri]);
  const player = useAudioPlayer(source, { updateInterval: 300 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    player.setPlaybackRate(speed);
  }, [player, speed]);

  function pushPreview(outputUri) {
    const editMeta = {
      mediaType: "audio",
      speed: String(speed),
      trimEnd: String(trimEnd),
      trimStart: String(trimStart),
      uri: outputUri,
      volume: String(volume),
    };
    const targetDraftId = storedDraft?.id || draftId;

    if (targetDraftId) {
      updateDraft(targetDraftId, {
        editMeta,
        type: "audio",
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
  }

  async function goPreview() {
    if (!uri || isProcessing) return;

    setIsProcessing(true);

    try {
      const outputUri = await processAudioEdit(uri, {
        speed,
        trimEnd,
        trimStart,
        volume,
      });

      pushPreview(outputUri);
    } catch {
      Alert.alert(
        "Preview pakai audio asli",
        "Proses edit native belum jalan di build ini, tapi preview post tetap bisa dicek.",
      );
      pushPreview(uri);
    } finally {
      setIsProcessing(false);
    }
  }

  function togglePlayback() {
    if (!uri) return;

    if (status.playing) {
      player.pause();
      return;
    }

    player.play();
  }

  function renderWaveform() {
    return (
      <View style={styles.emptyPreview}>
        <Pressable style={styles.audioPlayButton} onPress={togglePlayback}>
          <Ionicons
            name={status.playing ? "pause" : "play"}
            size={30}
            color={colors.onPrimary}
          />
        </Pressable>
        <View style={styles.editorWaveform}>
          {waveformBars.map((height, index) => (
            <View
              key={`${height}-${index}`}
              style={[
                styles.editorWaveBar,
                {
                  height: height + 18,
                  backgroundColor:
                    index % 2 ? colors.secondary : colors.tertiary,
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.emptyTitle}>
          {uri ? formatTime(status.currentTime || 0) : "Audio belum ada"}
        </Text>
        <Text style={styles.emptyText}>
          {uri
            ? "Preview voice note dan rapikan durasi sebelum post."
            : "Record audio dari tab Add dulu untuk masuk ke editor."}
        </Text>
      </View>
    );
  }

  function renderPanel() {
    if (activeTool === "volume") {
      return renderSlider("Volume", volume, setVolume, 0, 1, 0.05);
    }

    if (activeTool === "speed") {
      return renderSlider("Speed", speed, setSpeed, 0.5, 2, 0.25, "x");
    }

    return (
      <>
        <Text style={styles.sliderLabel}>
          {activeTool === "split" ? "Split point" : "Trim audio"} {trimStart}s -
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

  function renderSlider(label, value, onChange, min, max, step, suffix = "") {
    return (
      <>
        <Text style={styles.sliderLabel}>
          {label} {suffix ? value.toFixed(1) : Math.round(value * 100)}
          {suffix}
        </Text>
        <Slider
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <EditorHeader
          title="Edit Audio"
          onBack={() => router.back()}
          onNext={goPreview}
        />
        {isProcessing ? (
          <Text style={styles.metaText}>Memproses audio...</Text>
        ) : null}
        <View style={[styles.previewCard, { height: previewHeight }]}>
          {renderWaveform()}
        </View>
        <View style={styles.panel}>{renderPanel()}</View>
        <EditorToolBar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          tools={audioTools}
        />
      </View>
    </SafeAreaView>
  );
}
