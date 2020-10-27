import React, {
    memo,
    useState,
    useEffect,
    useMemo,
    useRef,
    forwardRef,
  } from "react";
  import { Dimensions, LayoutAnimation, Platform } from "react-native";
  import { Tooltip, Text } from "react-native-elements";
  import MapView, { Marker, Polyline } from "react-native-maps";
  import SuperCluster from "supercluster";
  import ClusterMarker from "react-native-map-clustering/lib/ClusteredMarker";
  import {
    isMarker,
    markerToGeoJSONFeature,
    calculateBBox,
    returnMapZoom,
    generateSpiral,
  } from "react-native-map-clustering/lib/helpers";
  
  const ClusteredMapView = forwardRef(
    (
        {
            radius,
            maxZoom,
            minZoom,
            extent,
            nodeSize,
            children,
            onClusterPress,
            onRegionChangeComplete,
            onMarkersChange,
            preserveClusterPressBehavior,
            clusteringEnabled,
            clusterColor,
            clusterTextColor,
            clusterFontFamily,
            spiderLineColor,
            layoutAnimationConf,
            animationEnabled,
            renderCluster,
            tracksViewChanges,
            spiralEnabled,
            superClusterRef,
            ...restProps
        },
        ref
    ) => {
        const [redMarkers, updateRedMarkers] = useState([]);
        const [blueMarkers, updateBlueMarkers] = useState([]);
        const [spiderMarkers, updateSpiderMarker] = useState([]);
        const [otherChildren, updateChildren] = useState([]);
        const [redSuperCluster, setRedSuperCluster] = useState(null);
        const [blueSuperCluster, setBlueSuperCluster] = useState(null);
        const [currentRegion, updateRegion] = useState(
            restProps.region || restProps.initialRegion
        );
  
        const [isSpiderfier, updateSpiderfier] = useState(false);
        const [clusterChildren, updateClusterChildren] = useState(null);
        const mapRef = useRef();
  
        const propsChildren = useMemo(() => React.Children.toArray(children), [
            children,
        ]);
  
        useEffect(() => {
            const redRawData = [];
            const blueRawData = [];
            const otherChildren = [];
  
            if (!clusteringEnabled) {
                updateSpiderMarker([]);
                updateRedMarkers([]);
                updateBlueMarkers([]);
                updateChildren(propsChildren);
                return;
            }
  
            React.Children.forEach(children, (child, index) => {
                if (isMarker(child) && child.props.pinColor === "#e36387") {
  
                    redRawData.push(markerToGeoJSONFeature(child, index));
                } else if (isMarker(child) && child.props.pinColor === "#0fabbc") {
                    blueRawData.push(markerToGeoJSONFeature(child, index));
                } else {
                    otherChildren.push(child);
                }
            });
  
            const redSuperCluster = new SuperCluster({
                radius,
                maxZoom,
                minZoom,
                extent,
                nodeSize,
            });
            const blueSuperCluster = new SuperCluster({
                radius,
                maxZoom,
                minZoom,
                extent,
                nodeSize,
            });
  
            redSuperCluster.load(redRawData);
            blueSuperCluster.load(blueRawData);
  
            const bBox = calculateBBox(currentRegion);
            const zoom = returnMapZoom(currentRegion, bBox, minZoom);
            const redMarkers = redSuperCluster.getClusters(bBox, zoom);
            const blueMarkers = blueSuperCluster.getClusters(bBox, zoom);
  
            updateRedMarkers(redMarkers);
            updateBlueMarkers(blueMarkers);
            updateChildren(otherChildren);
            setRedSuperCluster(redSuperCluster);
            setBlueSuperCluster(blueSuperCluster);
  
            superClusterRef.current = redSuperCluster;
        }, [
            children,
            restProps.region,
            restProps.initialRegion,
            clusteringEnabled,
        ]);
  
        useEffect(() => {
            if (!spiralEnabled) return;
  
            if (isSpiderfier && (redMarkers.length > 0 || blueMarkers.length > 0)) {
                let allSpiderMarkers = [];
  
                redMarkers.map((marker, i) => {
                    let positions = generateSpiral(marker, clusterChildren, redMarkers, i);
                    allSpiderMarkers.push(...positions);
                });
  
                blueMarkers.map((marker, i) => {
                    let positions = generateSpiral(marker, clusterChildren, blueMarkers, i);
                    allSpiderMarkers.push(...positions);
                });
  
                updateSpiderMarker(allSpiderMarkers);
            } else {
                updateSpiderMarker([]);
            }
        }, [isSpiderfier, redMarkers, blueMarkers]);
  
        const _onRegionChangeComplete = (region) => {
            if (redSuperCluster || blueSuperCluster) {
                const bBox = calculateBBox(region);
                const zoom = returnMapZoom(region, bBox, minZoom);
                const redMarkers = redSuperCluster.getClusters(bBox, zoom);
                const blueMarkers = blueSuperCluster.getClusters(bBox, zoom);
  
                if (animationEnabled && Platform.OS === "ios") {
                    LayoutAnimation.configureNext(layoutAnimationConf);
                }
                if (zoom >= 17 && (redMarkers.length > 0 || blueMarkers.length > 0) && clusterChildren) {
                    if (spiralEnabled) updateSpiderfier(true);
                } else {
                    if (spiralEnabled) updateSpiderfier(false);
                }
  
                updateRedMarkers(redMarkers);
                updateBlueMarkers(blueMarkers);
                onMarkersChange(redMarkers, blueMarkers);
                onRegionChangeComplete(region, redMarkers, blueMarkers);
                updateRegion(region);
            } else {
                onRegionChangeComplete(region);
            }
        };
  
        const _onClusterPress = (cluster, color) => () => {
            const children = color === 'red' ? redSuperCluster.getLeaves(cluster.id, Infinity) : blueSuperCluster.getLeaves(cluster.id, Infinity);
            updateClusterChildren(children);
  
            if (preserveClusterPressBehavior) {
              onClusterPress(cluster, children, color);
              return;
            }
  
            const coordinates = children.map(({ geometry }) => ({
              latitude: geometry.coordinates[1],
              longitude: geometry.coordinates[0],
            }));
  
          //   mapRef.current.fitToCoordinates(coordinates, {
          //     edgePadding: restProps.edgePadding,
          //   });
  
            onClusterPress(cluster, children, color);
        };
  
        return (
            <MapView
                {...restProps} s
                ref={(map) => {
                    mapRef.current = map;
                    if (ref) ref.current = map;
                    restProps.mapRef(map);
                }}
                onRegionChangeComplete={_onRegionChangeComplete}
            >
                {redMarkers.map((marker, i) =>
                    marker.properties.point_count === 0 ? (
                        propsChildren[marker.properties.index]
                    ) : !isSpiderfier ? (
                        renderCluster ? (
                            renderCluster({
                                onPress: _onClusterPress(marker, 'red'),
                                clusterColor,
                                clusterTextColor,
                                clusterFontFamily,
                                ...marker,
                            })
                        ) : (
  
  
  
                                    <ClusterMarker
                                        key={`cluster-${marker.id}`}
                                        {...marker}
                                        onPress={_onClusterPress(marker, 'red')}
                                        clusterColor="#e36387"
                                        clusterTextColor={clusterTextColor}
                                        clusterFontFamily={clusterFontFamily}
                                        tracksViewChanges={tracksViewChanges}
                                    />
  
  
                            )
                    ) : null
                )}
                {blueMarkers.map((marker, i) =>
                    marker.properties.point_count === 0 ? (
                        propsChildren[marker.properties.index]
                    ) : !isSpiderfier ? (
                        renderCluster ? (
                            renderCluster({
                                onPress: _onClusterPress(marker, 'blue'),
                                clusterColor,
                                clusterTextColor,
                                clusterFontFamily,
                                ...marker,
                            })
                        ) : (
                                
                            
                                    <ClusterMarker
                                        key={`cluster-${marker.id}`}
                                        {...marker}
                                        onPress={_onClusterPress(marker, 'blue')}
                                        clusterColor="#0fabbc"
                                        clusterTextColor={clusterTextColor}
                                        clusterFontFamily={clusterFontFamily}
                                        tracksViewChanges={tracksViewChanges}
                                    />
  
                            )
                    ) : null
                )}
                {otherChildren}
                {spiderMarkers.map((marker) => {
                    return propsChildren[marker.index]
                        ? React.cloneElement(propsChildren[marker.index], {
                            coordinate: { ...marker },
                        })
                        : null;
                })}
                {spiderMarkers.map((marker, index) => {
                    {
                        return (
                            <Polyline
                                key={index}
                                coordinates={[marker.centerPoint, marker, marker.centerPoint]}
                                strokeColor={spiderLineColor}
                                strokeWidth={1}
                            />
                        );
                    }
                })}
            </MapView>
        );
    }
  );
  
  ClusteredMapView.defaultProps = {
    clusteringEnabled: true,
    spiralEnabled: true,
    animationEnabled: true,
    preserveClusterPressBehavior: false,
    layoutAnimationConf: LayoutAnimation.Presets.spring,
    tracksViewChanges: false,
    // SuperCluster parameters
    radius: Dimensions.get("window").width * 0.1,
    maxZoom: 20,
    minZoom: 1,
    extent: 250,
    nodeSize: 64,
    // Map parameters
    edgePadding: { top: 50, left: 50, right: 50, bottom: 50 },
    // Cluster styles
  
    clusterTextColor: "#FFFFFF",
    spiderLineColor: "#FF0000",
    // Callbacks
    onRegionChangeComplete: () => { },
    onClusterPress: () => { },
    onMarkersChange: () => { },
    superClusterRef: {},
    mapRef: () => { },
  };
  
  export default memo(ClusteredMapView);
  