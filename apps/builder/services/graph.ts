import { Edge, Table, Target } from 'models'
import { AnchorsPositionProps } from 'components/shared/Graph/Edges/Edge'
import {
  stubLength,
  blockWidth,
  blockAnchorsOffset,
  ConnectingIds,
  Endpoint,
  Coordinates,
  BlocksCoordinates,
} from 'contexts/GraphContext'
import { roundCorners } from 'svg-round-corners'
import { headerHeight } from 'components/shared/TypebotHeader'

export const computeDropOffPath = (
  sourcePosition: Coordinates,
  sourceStepIndex: number
) => {
  const sourceCoord = computeSourceCoordinates(sourcePosition, sourceStepIndex)
  const segments = computeTwoSegments(sourceCoord, {
    x: sourceCoord.x + 20,
    y: sourceCoord.y + 80,
  })
  return roundCorners(`M${sourceCoord.x},${sourceCoord.y} ${segments}`, 10).path
}

export const computeSourceCoordinates = (
  sourcePosition: Coordinates,
  sourceTop: number
) => ({
  x: sourcePosition.x + blockWidth,
  y: sourceTop,
})

const getSegments = ({
  sourcePosition,
  targetPosition,
  sourceType,
  totalSegments,
}: AnchorsPositionProps) => {
  switch (totalSegments) {
    case 2:
      return computeTwoSegments(sourcePosition, targetPosition)
    case 3:
      return computeThreeSegments(sourcePosition, targetPosition, sourceType)
    case 4:
      return computeFourSegments(sourcePosition, targetPosition, sourceType)
    default:
      return computeFiveSegments(sourcePosition, targetPosition, sourceType)
  }
}

const computeTwoSegments = (
  sourcePosition: Coordinates,
  targetPosition: Coordinates
) => {
  const segments = []
  segments.push(`L${targetPosition.x},${sourcePosition.y}`)
  segments.push(`L${targetPosition.x},${targetPosition.y}`)
  return segments.join(' ')
}

const computeThreeSegments = (
  sourcePosition: Coordinates,
  targetPosition: Coordinates,
  sourceType: 'right' | 'left'
) => {
  const segments = []
  const firstSegmentX =
    sourceType === 'right'
      ? sourcePosition.x + (targetPosition.x - sourcePosition.x) / 2
      : sourcePosition.x - (sourcePosition.x - targetPosition.x) / 2
  segments.push(`L${firstSegmentX},${sourcePosition.y}`)
  segments.push(`L${firstSegmentX},${targetPosition.y}`)
  segments.push(`L${targetPosition.x},${targetPosition.y}`)
  return segments.join(' ')
}

const computeFourSegments = (
  sourcePosition: Coordinates,
  targetPosition: Coordinates,
  sourceType: 'right' | 'left'
) => {
  const segments = []
  const firstSegmentX =
    sourcePosition.x + (sourceType === 'right' ? stubLength : -stubLength)
  segments.push(`L${firstSegmentX},${sourcePosition.y}`)
  const secondSegmentY =
    sourcePosition.y + (targetPosition.y - sourcePosition.y) / 2
  segments.push(`L${firstSegmentX},${secondSegmentY}`)

  segments.push(`L${targetPosition.x},${secondSegmentY}`)

  segments.push(`L${targetPosition.x},${targetPosition.y}`)
  return segments.join(' ')
}

const computeFiveSegments = (
  sourcePosition: Coordinates,
  targetPosition: Coordinates,
  sourceType: 'right' | 'left'
) => {
  const segments = []
  const firstSegmentX =
    sourcePosition.x + (sourceType === 'right' ? stubLength : -stubLength)
  segments.push(`L${firstSegmentX},${sourcePosition.y}`)
  const firstSegmentY =
    sourcePosition.y + (targetPosition.y - sourcePosition.y) / 2
  segments.push(
    `L${
      sourcePosition.x + (sourceType === 'right' ? stubLength : -stubLength)
    },${firstSegmentY}`
  )

  const secondSegmentX =
    targetPosition.x - (sourceType === 'right' ? stubLength : -stubLength)
  segments.push(`L${secondSegmentX},${firstSegmentY}`)

  segments.push(`L${secondSegmentX},${targetPosition.y}`)

  segments.push(`L${targetPosition.x},${targetPosition.y}`)
  return segments.join(' ')
}

type GetAnchorsPositionParams = {
  sourceBlockCoordinates: Coordinates
  targetBlockCoordinates: Coordinates
  sourceTop: number
  targetTop?: number
}
export const getAnchorsPosition = ({
  sourceBlockCoordinates,
  targetBlockCoordinates,
  sourceTop,
  targetTop,
}: GetAnchorsPositionParams): AnchorsPositionProps => {
  const sourcePosition = computeSourceCoordinates(
    sourceBlockCoordinates,
    sourceTop
  )
  let sourceType: 'right' | 'left' = 'right'
  if (sourceBlockCoordinates.x > targetBlockCoordinates.x) {
    sourcePosition.x = sourceBlockCoordinates.x
    sourceType = 'left'
  }

  const { targetPosition, totalSegments } = computeBlockTargetPosition(
    sourceBlockCoordinates,
    targetBlockCoordinates,
    sourcePosition.y,
    targetTop
  )
  return { sourcePosition, targetPosition, sourceType, totalSegments }
}

const computeBlockTargetPosition = (
  sourceBlockPosition: Coordinates,
  targetBlockPosition: Coordinates,
  sourceOffsetY: number,
  targetOffsetY?: number
): { targetPosition: Coordinates; totalSegments: number } => {
  const isTargetBlockBelow =
    targetBlockPosition.y > sourceOffsetY &&
    targetBlockPosition.x < sourceBlockPosition.x + blockWidth + stubLength &&
    targetBlockPosition.x > sourceBlockPosition.x - blockWidth - stubLength
  const isTargetBlockToTheRight = targetBlockPosition.x < sourceBlockPosition.x
  const isTargettingBlock = !targetOffsetY

  if (isTargetBlockBelow && isTargettingBlock) {
    const isExterior =
      targetBlockPosition.x <
        sourceBlockPosition.x - blockWidth / 2 - stubLength ||
      targetBlockPosition.x >
        sourceBlockPosition.x + blockWidth / 2 + stubLength
    const targetPosition = parseBlockAnchorPosition(targetBlockPosition, 'top')
    return { totalSegments: isExterior ? 2 : 4, targetPosition }
  } else {
    const isExterior =
      targetBlockPosition.x < sourceBlockPosition.x - blockWidth ||
      targetBlockPosition.x > sourceBlockPosition.x + blockWidth
    const targetPosition = parseBlockAnchorPosition(
      targetBlockPosition,
      isTargetBlockToTheRight ? 'right' : 'left',
      targetOffsetY
    )
    return { totalSegments: isExterior ? 3 : 5, targetPosition }
  }
}

const parseBlockAnchorPosition = (
  blockPosition: Coordinates,
  anchor: 'left' | 'top' | 'right',
  targetOffsetY?: number
): Coordinates => {
  switch (anchor) {
    case 'left':
      return {
        x: blockPosition.x + blockAnchorsOffset.left.x,
        y: targetOffsetY ?? blockPosition.y + blockAnchorsOffset.left.y,
      }
    case 'top':
      return {
        x: blockPosition.x + blockAnchorsOffset.top.x,
        y: blockPosition.y + blockAnchorsOffset.top.y,
      }
    case 'right':
      return {
        x: blockPosition.x + blockAnchorsOffset.right.x,
        y: targetOffsetY ?? blockPosition.y + blockAnchorsOffset.right.y,
      }
  }
}

export const computeEdgePath = ({
  sourcePosition,
  targetPosition,
  sourceType,
  totalSegments,
}: AnchorsPositionProps) => {
  const segments = getSegments({
    sourcePosition,
    targetPosition,
    sourceType,
    totalSegments,
  })
  return roundCorners(
    `M${sourcePosition.x},${sourcePosition.y} ${segments}`,
    10
  ).path
}

export const computeConnectingEdgePath = ({
  connectingIds,
  sourceTop,
  targetTop,
  blocksCoordinates,
}: {
  connectingIds: Omit<ConnectingIds, 'target'> & { target: Target }
  sourceTop: number
  targetTop?: number
  blocksCoordinates: BlocksCoordinates
}) => {
  const sourceBlockCoordinates =
    blocksCoordinates.byId[connectingIds.source.blockId]
  const targetBlockCoordinates =
    blocksCoordinates.byId[connectingIds.target.blockId]
  const anchorsPosition = getAnchorsPosition({
    sourceBlockCoordinates,
    targetBlockCoordinates,
    sourceTop,
    targetTop,
  })
  return computeEdgePath(anchorsPosition)
}

export const computeEdgePathToMouse = ({
  blockPosition,
  mousePosition,
  sourceTop,
}: {
  blockPosition: Coordinates
  mousePosition: Coordinates
  sourceTop: number
}): string => {
  const sourcePosition = {
    x:
      mousePosition.x - blockPosition.x > blockWidth / 2
        ? blockPosition.x + blockWidth - 40
        : blockPosition.x + 40,
    y: sourceTop,
  }
  const sourceType =
    mousePosition.x - blockPosition.x > blockWidth / 2 ? 'right' : 'left'
  const segments = computeThreeSegments(
    sourcePosition,
    mousePosition,
    sourceType
  )
  return roundCorners(
    `M${sourcePosition.x},${sourcePosition.y} ${segments}`,
    10
  ).path
}

export const getEndpointTopOffset = (
  graphPosition: Coordinates,
  endpoints: Table<Endpoint>,
  endpointId?: string
): number | undefined => {
  if (!endpointId) return
  const endpointRef = endpoints.byId[endpointId]?.ref
  if (!endpointRef) return
  return (
    8 +
    (endpointRef.current?.getBoundingClientRect().top ?? 0) -
    graphPosition.y -
    headerHeight
  )
}

export const getSourceEndpointId = (edge?: Edge) =>
  edge?.from.buttonId ?? edge?.from.stepId + `${edge?.from.conditionType ?? ''}`
