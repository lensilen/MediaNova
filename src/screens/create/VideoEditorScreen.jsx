import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useEvent } from "expo";
import * as VideoThumbnails from "expo-video-thumbnails";
import { VideoView, useVideoPlayer } from "expo-video";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { FilterStrip } from "../../components/editor/FilterStrip";
import { StickerOverlay } from "../../components/editor/StickerOverlay";
import { colors } from "../../constants/theme";
import { useCreateDraftStore } from "../../store/createDraftStore";
import { processVideoEdit } from "../../utils/mediaProcessing";
import { filters, getStickerByKey, noFilter, videoTools } from "./createOptions";
import { EditorHeader } from "./EditorHeader";
import { EditorToolBar } from "./EditorToolBar";
import { SaturationSlider } from "./SaturationSlider";
import { editorStyles as styles } from "./editorStyles";

function getFilterByKey(key) {
  return filters.find((filter) => filter.key === key) || noFilter;
}

function effectOpacity(value, max = 0.35) {
  return Math.min(Math.abs(value) * max, max);
}

const textColors = ["#FFFFFF", "#2F4156", "#567C8D", "#C8D9E6", "#C81E1E"];
const textFonts = [
  { key: "system", label: "Inter", value: undefined },
  { key: "serif", label: "Serif", value: "serif" },
  { key: "mono", label: "Mono", value: "monospace" },
];

function clampPosition(value, min, max) {
  "worklet";
  return Math.max(min, Math.min(max, value));
}

export function VideoEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { height, width } = useWindowDimensions();
  const draftId = typeof params.draftId === "string" ? params.draftId : "";
  const storedDraft = useCreateDraftStore((state) =>
    state.drafts[draftId] || state.drafts[state.currentDraftId],
  );
  const updateDraft = useCreateDraftStore((state) => state.updateDraft);
  const uri = storedDraft?.uri || (typeof params.uri === "string" ? params.uri : "");
  const storedThumbnail = storedDraft?.thumbnailUri || "";
  const maxPreviewHeight = Math.min(430, Math.max(300, height * 0.46));
  const previewWidth = Math.min(width - 36, maxPreviewHeight * 0.5625);
  const previewHeight = previewWidth * 1.7778;
  const [activeTool, setActiveTool] = useState("trim");
  const [selectedFilter, setSelectedFilter] = useState(
    getFilterByKey(storedDraft?.filter || params.filter),
  );
  const selectedSticker = getStickerByKey(storedDraft?.sticker || params.sticker);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [overlayText, setOverlayText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textSize, setTextSize] = useState(24);
  const [textBold, setTextBold] = useState(true);
  const [textItalic, setTextItalic] = useState(false);
  const [textFont, setTextFont] = useState(textFonts[0]);
  const [textPosition, setTextPosition] = useState({ x: 22, y: 170 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitPoint, setSplitPoint] = useState(30);
  const [thumbnail, setThumbnail] = useState({ sourceUri: "", uri: "" });
  const [firstFrameSource, setFirstFrameSource] = useState("");
  const textX = useSharedValue(22);
  const textY = useSharedValue(170);
  const startTextX = useSharedValue(22);
  const startTextY = useSharedValue(170);
  const thumbnailUri =
    thumbnail.sourceUri === uri ? thumbnail.uri || storedThumbnail : storedThumbnail;
  const firstFrameReady = firstFrameSource === uri;

  useEffect(() => {
    textX.set(Math.max(8, Math.min(previewWidth - 80, textPosition.x)));
    textY.set(Math.max(8, Math.min(previewHeight - 54, textPosition.y)));
  }, [previewHeight, previewWidth, textPosition.x, textPosition.y, textX, textY]);

  function saveTextPosition(nextPosition) {
    setTextPosition(nextPosition);
  }

  const textDragGesture = Gesture.Pan()
    .onBegin(() => {
      startTextX.set(textX.get());
      startTextY.set(textY.get());
    })
    .onUpdate((event) => {
      textX.set(clampPosition(
        startTextX.get() + event.translationX,
        8,
        previewWidth - 80,
      ));
      textY.set(clampPosition(
        startTextY.get() + event.translationY,
        8,
        previewHeight - 54,
      ));
    })
    .onEnd(() => {
      runOnJS(saveTextPosition)({ x: textX.get(), y: textY.get() });
    });

  const textAnimatedStyle = useAnimatedStyle(() => ({
    left: textX.get(),
    top: textY.get(),
  }));

  const videoSource = useMemo(() => uri || null, [uri]);
  const player = useVideoPlayer(videoSource, (nextPlayer) => {
    nextPlayer.loop = false;
    nextPlayer.timeUpdateEventInterval = 0.25;
    nextPlayer.play();
  });
  const playingState = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const statusState = useEvent(player, "statusChange", {
    status: player.status,
  });
  const timeState = useEvent(player, "timeUpdate", {
    currentTime: player.currentTime,
  });
  const isPlaying = Boolean(playingState?.isPlaying);
  const seekPreview = useCallback(
    (second, shouldPause = true) => {
      if (shouldPause) player.pause();
      player.seekBy(second - (player.currentTime || 0));
    },
    [player],
  );

  useEffect(() => {
    let isActive = true;

    if (!uri) return undefined;

    VideoThumbnails.getThumbnailAsync(uri, { time: 350 })
      .then((result) => {
        if (isActive) {
          setThumbnail({ sourceUri: uri, uri: result.uri });
          updateDraft(storedDraft?.id || draftId, {
            thumbnailUri: result.uri,
          });
        }
      })
      .catch(() => {
        if (isActive) {
          setThumbnail({ sourceUri: uri, uri: "" });
        }
      });

    return () => {
      isActive = false;
    };
  }, [draftId, storedDraft?.id, updateDraft, uri]);

  function toggleVideoPreview() {
    if (isPlaying) {
      player.pause();
      return;
    }

    if (player.currentTime < trimStart || player.currentTime >= trimEnd) {
      seekPreview(trimStart, false);
    }

    player.play();
  }

  useEffect(() => {
    const currentTime = timeState?.currentTime || 0;

    if (isPlaying && currentTime >= trimEnd) {
      seekPreview(trimStart, false);
      player.play();
    }
  }, [isPlaying, player, seekPreview, timeState?.currentTime, trimEnd, trimStart]);

  function changeTrimStart(value) {
    const nextStart = Math.min(value, trimEnd - 1);
    setTrimStart(nextStart);
    seekPreview(nextStart);
  }

  function changeTrimEnd(value) {
    const nextEnd = Math.max(value, trimStart + 1);
    setTrimEnd(nextEnd);
    seekPreview(nextEnd);
  }

  function buildEditMeta(outputUri = uri) {
    return {
      brightness: String(brightness),
      contrast: String(contrast),
      filter: selectedFilter.key,
      mediaType: "video",
      overlayText,
      saturation: String(saturation),
      speed: String(speed),
      sticker: selectedSticker.key,
      textColor,
      textSize: String(textSize),
      textX: String(textPosition.x),
      textY: String(textPosition.y),
      trimEnd: String(trimEnd),
      trimStart: String(trimStart),
      uri: outputUri,
      volume: String(volume),
    };
  }

  function pushPreview(outputUri) {
    const editMeta = buildEditMeta(outputUri);
    const targetDraftId = storedDraft?.id || draftId;

    if (targetDraftId) {
      updateDraft(targetDraftId, {
        editMeta,
        filter: selectedFilter.key,
        sticker: selectedSticker.key,
        type: "video",
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
      const outputUri = await processVideoEdit(uri, {
        brightness,
        contrast,
        filter: selectedFilter.key,
        overlayText,
        textColor,
        textSize,
        textX: textPosition.x,
        textY: textPosition.y,
        saturation,
        speed,
        trimEnd,
        trimStart,
        volume,
      });

      pushPreview(outputUri);
    } catch {
      Alert.alert(
        "Preview pakai video asli",
        "Proses edit native belum jalan di build ini, tapi preview post tetap bisa dicek.",
      );
      pushPreview(uri);
    } finally {
      setIsProcessing(false);
    }
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
          {thumbnailUri && (!isPlaying || !firstFrameReady) ? (
          <Image source={{ uri: thumbnailUri }} style={styles.previewPoster} />
        ) : null}
        <VideoView
          allowsFullscreen
          contentFit="cover"
          nativeControls={false}
          onFirstFrameRender={() => setFirstFrameSource(uri)}
          player={player}
          surfaceType="textureView"
          useExoShutter={false}
          style={styles.previewMedia}
        />
        {statusState?.status === "error" ? (
          <View style={styles.videoErrorBadge}>
            <Ionicons name="warning-outline" size={15} color={colors.onPrimary} />
            <Text style={styles.videoErrorText}>Preview video belum kebaca</Text>
          </View>
        ) : null}
        <View
          pointerEvents="none"
          style={[
            styles.filterTint,
            {
              backgroundColor: selectedFilter.tint,
              opacity: selectedFilter.key === "none" ? 0 : 1,
            },
          ]}
        />
        {brightness ? (
          <View
            pointerEvents="none"
            style={[
              styles.previewEffectLayer,
              {
                backgroundColor: brightness > 0 ? "#FFFFFF" : "#000000",
                opacity: effectOpacity(brightness, 0.34),
              },
            ]}
          />
        ) : null}
        {contrast ? (
          <View
            pointerEvents="none"
            style={[
              styles.previewEffectLayer,
              {
                backgroundColor:
                  contrast > 0 ? "rgba(0,0,0,0.18)" : "rgba(148,163,184,0.26)",
                opacity: effectOpacity(contrast, 0.5),
              },
            ]}
          />
        ) : null}
        {saturation ? (
          <View
            pointerEvents="none"
            style={[
              styles.previewEffectLayer,
              {
                backgroundColor:
                  saturation > 0
                    ? "rgba(200,30,30,0.22)"
                    : "rgba(107,114,128,0.34)",
                opacity: effectOpacity(saturation, 0.52),
              },
            ]}
          />
        ) : null}
        <StickerOverlay sticker={selectedSticker} />
        {overlayText ? (
          <GestureDetector gesture={textDragGesture}>
            <Animated.View
              style={[
                styles.draggableTextBox,
                textAnimatedStyle,
              ]}
            >
              <Text
                numberOfLines={3}
                style={[
                  styles.overlayText,
                  {
                    color: textColor,
                    fontFamily: textFont.value,
                    fontSize: textSize,
                    fontStyle: textItalic ? "italic" : "normal",
                    fontWeight: textBold ? "900" : "600",
                  },
                ]}
              >
                {overlayText}
              </Text>
            </Animated.View>
          </GestureDetector>
        ) : null}
        <Pressable style={styles.previewPlayButton} onPress={toggleVideoPreview}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={24}
            color={colors.onPrimary}
          />
        </Pressable>
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

    if (activeTool === "beauty") {
      return (
        <>
          <Text style={styles.sliderLabel}>
            Brightness {Math.round(brightness * 100)}
          </Text>
          <View style={styles.sliderHintRow}>
            <Ionicons name="moon-outline" size={16} color={colors.muted} />
            <Ionicons name="sunny-outline" size={17} color={colors.warning} />
          </View>
          <Slider
            minimumValue={-1}
            maximumValue={1}
            step={0.05}
            value={brightness}
            onValueChange={setBrightness}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
          <Text style={styles.sliderLabel}>
            Contrast {Math.round(contrast * 100)}
          </Text>
          <View style={styles.sliderHintRow}>
            <Ionicons name="contrast-outline" size={16} color={colors.muted} />
            <Ionicons name="contrast" size={17} color={colors.primary} />
          </View>
          <Slider
            minimumValue={-1}
            maximumValue={1}
            step={0.05}
            value={contrast}
            onValueChange={setContrast}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
          <Text style={styles.sliderLabel}>
            Saturation {Math.round(saturation * 100)}
          </Text>
          <SaturationSlider value={saturation} onChange={setSaturation} />
        </>
      );
    }

    if (activeTool === "text") {
      return (
        <View style={styles.textPanel}>
          <TextInput
            value={overlayText}
            onChangeText={setOverlayText}
            placeholder="Tulis overlay video..."
            placeholderTextColor={colors.muted}
            style={styles.textInput}
          />
          <View style={styles.textOptionRow}>
            <Pressable
              style={[
                styles.textOptionButton,
                textBold ? styles.textOptionButtonActive : null,
              ]}
              onPress={() => setTextBold((value) => !value)}
            >
              <Text
                style={[
                  styles.textOptionText,
                  textBold ? styles.textOptionTextActive : null,
                  { fontWeight: "900" },
                ]}
              >
                B
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.textOptionButton,
                textItalic ? styles.textOptionButtonActive : null,
              ]}
              onPress={() => setTextItalic((value) => !value)}
            >
              <Text
                style={[
                  styles.textOptionText,
                  textItalic ? styles.textOptionTextActive : null,
                  { fontStyle: "italic" },
                ]}
              >
                I
              </Text>
            </Pressable>
            {textFonts.map((font) => (
              <Pressable
                key={font.key}
                style={[
                  styles.textOptionButton,
                  textFont.key === font.key ? styles.textOptionButtonActive : null,
                ]}
                onPress={() => setTextFont(font)}
              >
                <Text
                  style={[
                    styles.textOptionText,
                    textFont.key === font.key ? styles.textOptionTextActive : null,
                    { fontFamily: font.value },
                  ]}
                >
                  {font.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.sliderLabel}>Ukuran {textSize}px</Text>
          <Slider
            minimumValue={14}
            maximumValue={42}
            step={1}
            value={textSize}
            onValueChange={setTextSize}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
          <View style={styles.textOptionRow}>
            {textColors.map((color) => (
              <Pressable
                key={color}
                onPress={() => setTextColor(color)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  textColor === color ? styles.colorSwatchActive : null,
                ]}
              />
            ))}
          </View>
        </View>
      );
    }

    if (activeTool === "split") {
      return (
        <>
          <Text style={styles.sliderLabel}>Split point {splitPoint}s</Text>
          <Slider
            minimumValue={1}
            maximumValue={59}
            step={1}
            value={splitPoint}
            onValueChange={(value) => {
              setSplitPoint(value);
              seekPreview(value);
            }}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
        </>
      );
    }

    return renderTrimPanel();
  }

  function renderTrimPanel() {
    const startPercent = `${(trimStart / 60) * 100}%`;
    const endPercent = `${100 - (trimEnd / 60) * 100}%`;

    return (
      <View style={styles.trimPanel}>
        <View style={styles.trimHeaderRow}>
          <Text style={styles.sliderLabel}>Start {trimStart}s</Text>
          <Text style={styles.sliderLabel}>End {trimEnd}s</Text>
        </View>
        <View style={styles.trimVisualTrack}>
          <View style={[styles.trimDimArea, { left: 0, width: startPercent }]} />
          <View style={[styles.trimDimArea, { right: 0, width: endPercent }]} />
          <View
            style={[
              styles.trimSelectedArea,
              { left: startPercent, right: endPercent },
            ]}
          />
          <View style={[styles.trimEdgeHandle, { left: startPercent }]} />
          <View style={[styles.trimEdgeHandle, { left: `${(trimEnd / 60) * 100}%` }]} />
        </View>
        <Text style={styles.metaText}>Geser awal klip</Text>
        <Slider
          minimumValue={0}
          maximumValue={Math.max(trimEnd - 1, 1)}
          step={1}
          value={trimStart}
          onValueChange={changeTrimStart}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
        />
        <Text style={styles.metaText}>Geser akhir klip</Text>
        <Slider
          minimumValue={Math.min(trimStart + 1, 59)}
          maximumValue={60}
          step={1}
          value={trimEnd}
          onValueChange={changeTrimEnd}
          minimumTrackTintColor={colors.secondary}
          maximumTrackTintColor={colors.border}
        />
      </View>
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
        {isProcessing ? (
          <Text style={styles.metaText}>Memproses video...</Text>
        ) : null}
        <View
          style={[
            styles.previewCard,
            styles.verticalPreviewCard,
            { height: previewHeight, width: previewWidth },
          ]}
        >
          {renderPreview()}
        </View>
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
