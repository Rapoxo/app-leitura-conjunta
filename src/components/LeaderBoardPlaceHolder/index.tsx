import { Flex, Skeleton, SkeletonCircle, useColorModeValue, Spacer } from "@chakra-ui/react";

const LeaderBoardPlaceHolder = () => {
  const isDarkMode = useColorModeValue(true, false);

  return (
    <Flex style={{transform: "scale(0.9)"}} m=".8em" alignContent="flex-start" maxW="1200px" w="100%" borderRadius="md" p="1em" bg={isDarkMode ? "white" : "gray.700"} flexDirection="row" minW="300px">
      <SkeletonCircle size="10" /> <Skeleton ml={5} alignSelf="center" height="20px" width="40%" /> <Spacer /> <Skeleton alignSelf="center" height="20px" width="10%" />
    </Flex>
  );
};

export default LeaderBoardPlaceHolder;
