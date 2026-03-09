using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kumashaurma.API.Models;
using Kumashaurma.API.Data;

namespace Kumashaurma.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly ApplicationDbContext _context;

        public UsersController(UserManager<AppUser> userManager, ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        /// <summary>
        /// Получить список всех пользователей (только для admin/manager)
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "admin,manager")]
        public async Task<ActionResult<IEnumerable<UserListDto>>> GetUsers(
            [FromQuery] string? role = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _userManager.Users.AsQueryable();

            if (!string.IsNullOrEmpty(role))
            {
                var userIdsInRole = await _context.UserRoles
                    .Where(ur => _context.Roles.Any(r => r.Id == ur.RoleId && r.Name == role))
                    .Select(ur => ur.UserId)
                    .ToListAsync();

                query = query.Where(u => userIdsInRole.Contains(u.Id));
            }

            var total = await query.CountAsync();
            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var result = new List<UserListDto>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                result.Add(new UserListDto
                {
                    Id = user.Id,
                    Phone = user.PhoneNumber ?? "",
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneVerified = user.PhoneVerified,
                    Roles = roles.ToList(),
                    CreatedAt = user.CreatedAt
                });
            }

            Response.Headers.Append("X-Total-Count", total.ToString());
            return Ok(result);
        }

        /// <summary>
        /// Получить пользователя по ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "admin,manager")]
        public async Task<ActionResult<UserDetailDto>> GetUser(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());

            if (user == null)
            {
                return NotFound();
            }

            var roles = await _userManager.GetRolesAsync(user);
            var addresses = await _context.UserAddresses
                .Where(a => a.UserId == id)
                .ToListAsync();

            return Ok(new UserDetailDto
            {
                Id = user.Id,
                Phone = user.PhoneNumber ?? "",
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneVerified = user.PhoneVerified,
                Roles = roles.ToList(),
                CreatedAt = user.CreatedAt,
                Addresses = addresses.Select(a => new UserAddressDto
                {
                    Id = a.Id,
                    Address = a.Address,
                    Entrance = a.Entrance,
                    Floor = a.Floor,
                    Apartment = a.Apartment,
                    Comment = a.Comment,
                    IsDefault = a.IsDefault
                }).ToList()
            });
        }

        /// <summary>
        /// Назначить роль пользователю (только для admin)
        /// </summary>
        [HttpPost("{id}/roles")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult> AssignRole(int id, [FromBody] AssignRoleDto dto)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());

            if (user == null)
            {
                return NotFound(new { message = "Пользователь не найден" });
            }

            if (!AppRoles.AllRoles.Contains(dto.Role))
            {
                return BadRequest(new { message = $"Недопустимая роль. Допустимые роли: {string.Join(", ", AppRoles.AllRoles)}" });
            }

            var result = await _userManager.AddToRoleAsync(user, dto.Role);

            if (!result.Succeeded)
            {
                return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
            }

            return Ok(new { message = $"Роль '{dto.Role}' успешно назначена" });
        }

        /// <summary>
        /// Удалить роль у пользователя (только для admin)
        /// </summary>
        [HttpDelete("{id}/roles/{role}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult> RemoveRole(int id, string role)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());

            if (user == null)
            {
                return NotFound(new { message = "Пользователь не найден" });
            }

            var result = await _userManager.RemoveFromRoleAsync(user, role);

            if (!result.Succeeded)
            {
                return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
            }

            return Ok(new { message = $"Роль '{role}' успешно удалена" });
        }

        /// <summary>
        /// Обновить профиль текущего пользователя
        /// </summary>
        [HttpPut("me")]
        public async Task<ActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return NotFound();
            }

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
            }

            return Ok(new { message = "Профиль обновлён" });
        }

        /// <summary>
        /// Добавить адрес текущему пользователю
        /// </summary>
        [HttpPost("me/addresses")]
        public async Task<ActionResult<UserAddressDto>> AddAddress([FromBody] CreateUserAddressDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return NotFound();
            }

            var address = new UserAddress
            {
                UserId = int.Parse(userId),
                Address = dto.Address,
                Entrance = dto.Entrance,
                Floor = dto.Floor,
                Apartment = dto.Apartment,
                Comment = dto.Comment,
                IsDefault = dto.IsDefault,
                CreatedAt = DateTime.UtcNow
            };

            // Если это адрес по умолчанию, сбросим флаг у остальных
            if (address.IsDefault)
            {
                var existingAddresses = await _context.UserAddresses
                    .Where(a => a.UserId == int.Parse(userId) && a.IsDefault)
                    .ToListAsync();

                foreach (var a in existingAddresses)
                {
                    a.IsDefault = false;
                }
            }

            _context.UserAddresses.Add(address);
            await _context.SaveChangesAsync();

            return Ok(new UserAddressDto
            {
                Id = address.Id,
                Address = address.Address,
                Entrance = address.Entrance,
                Floor = address.Floor,
                Apartment = address.Apartment,
                Comment = address.Comment,
                IsDefault = address.IsDefault
            });
        }

        /// <summary>
        /// Получить адреса текущего пользователя
        /// </summary>
        [HttpGet("me/addresses")]
        public async Task<ActionResult<IEnumerable<UserAddressDto>>> GetMyAddresses()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var addresses = await _context.UserAddresses
                .Where(a => a.UserId == int.Parse(userId))
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(addresses.Select(a => new UserAddressDto
            {
                Id = a.Id,
                Address = a.Address,
                Entrance = a.Entrance,
                Floor = a.Floor,
                Apartment = a.Apartment,
                Comment = a.Comment,
                IsDefault = a.IsDefault
            }));
        }

        /// <summary>
        /// Удалить адрес
        /// </summary>
        [HttpDelete("me/addresses/{id}")]
        public async Task<ActionResult> DeleteAddress(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var address = await _context.UserAddresses
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == int.Parse(userId));

            if (address == null)
            {
                return NotFound();
            }

            _context.UserAddresses.Remove(address);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    // DTOs
    public class UserListDto
    {
        public int Id { get; set; }
        public string Phone { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public bool PhoneVerified { get; set; }
        public List<string> Roles { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class UserDetailDto : UserListDto
    {
        public List<UserAddressDto> Addresses { get; set; } = new();
    }

    public class UserAddressDto
    {
        public int Id { get; set; }
        public string Address { get; set; } = string.Empty;
        public string? Entrance { get; set; }
        public string? Floor { get; set; }
        public string? Apartment { get; set; }
        public string? Comment { get; set; }
        public bool IsDefault { get; set; }
    }

    public class AssignRoleDto
    {
        public string Role { get; set; } = string.Empty;
    }

    public class UpdateProfileDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
    }

    public class CreateUserAddressDto
    {
        public string Address { get; set; } = string.Empty;
        public string? Entrance { get; set; }
        public string? Floor { get; set; }
        public string? Apartment { get; set; }
        public string? Comment { get; set; }
        public bool IsDefault { get; set; } = false;
    }
}
