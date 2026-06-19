import { Text, View } from "react-native";

import { formatTime, noFilter } from "./createOptions";
import { CreateModeControls } from "./CreateModeControls";
import { CreateToolOverlay } from "./CreateToolOverlay";
import { createStyles as styles } from "./createStyles";

export function CreateCameraShell({
  activeRecording,
  countdown,
  flashMode,
  mode,
  onCapture,
  onFilterSelect,
  onFlipCamera,
  onLibraryPress,
  onModeChange,
  onPauseVideo,
  onResetFilter,
  onToolPress,
  pendingMedia,
  recordSeconds,
  renderCameraContent,
  selectedFilter,
  showFilters,
  timerSeconds,
  videoPaused,
}) {
  const activeTools = [
    ...(timerSeconds > 0 ? ["timer"] : []),
    ...(flashMode !== "off" ? ["flash"] : []),
    ...(selectedFilter.key !== noFilter.key ? ["filter"] : []),
  ];

  return (
    <View style={styles.cameraShell}>
      {renderCameraContent()}
      {mode !== "audio" ? (
        <View
          pointerEvents="none"
          style={[styles.filterTint, { backgroundColor: selectedFilter.tint }]}
        />
      ) : null}
      {countdown ? (
        <View pointerEvents="none" style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      ) : null}

      <CreateToolOverlay
        activeRecording={activeRecording}
        activeTools={activeTools}
        filterLabel={selectedFilter.key === noFilter.key ? "" : selectedFilter.label}
        flashMode={flashMode}
        formattedRecordTime={formatTime(recordSeconds)}
        isCountingDown={Boolean(countdown)}
        onFlipCamera={onFlipCamera}
        onToolPress={onToolPress}
        timerSeconds={timerSeconds}
      />
      <CreateModeControls
        activeRecording={activeRecording}
        mode={mode}
        onCapture={onCapture}
        onFilterSelect={onFilterSelect}
        onLibraryPress={onLibraryPress}
        onModeChange={onModeChange}
        onPauseVideo={onPauseVideo}
        onResetFilter={onResetFilter}
        pendingMedia={pendingMedia}
        selectedFilter={selectedFilter || noFilter}
        showFilters={showFilters}
        videoPaused={videoPaused}
      />
    </View>
  );
}
