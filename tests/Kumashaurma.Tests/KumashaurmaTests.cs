using Xunit;

namespace Kumashaurma.Tests
{
    public class KumashaurmaTests
    {
        [Fact]
        public void Test_ShouldPass()
        {
            Assert.True(true);
        }

        [Fact]
        public void Test_Addition()
        {
            var result = 2 + 2;
            Assert.Equal(4, result);
        }
    }
}
