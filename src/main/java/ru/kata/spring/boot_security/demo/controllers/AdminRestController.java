package ru.kata.spring.boot_security.demo.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import ru.kata.spring.boot_security.demo.dto.UserDTO;
import ru.kata.spring.boot_security.demo.models.Role;
import ru.kata.spring.boot_security.demo.models.User;
import ru.kata.spring.boot_security.demo.repositories.RoleRepository;
import ru.kata.spring.boot_security.demo.repositories.UserRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRestController {


    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder encoder;

    public AdminRestController(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder encoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.encoder = encoder;
    }

    @GetMapping("/users")
    public List<User> getUsers(){
        return userRepository.findAll();
    }

    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) {
        return userRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Пользователь не найден")
        );
    }

    @PostMapping("/users")
    public User createUser(@RequestBody UserDTO request) {

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(encoder.encode(request.getPassword()));

        Set<Role> roles = getRoles(request.getRoleIds());
        user.setRoles(roles);

        return userRepository.save(user);
    }
    @PatchMapping(value = "/users/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public User updateUser(@PathVariable Long id,
                           @RequestBody UserDTO request) {

        User exist = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        exist.setUsername(request.getUsername());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            exist.setPassword(encoder.encode(request.getPassword()));
        }

        exist.setRoles(getRoles(request.getRoleIds()));

        return userRepository.save(exist);
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
    }
    private Set<Role> getRoles(Set<Long> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) {
            Role def = roleRepository.findFirstByName("ROLE_USER").orElseThrow();
            return Set.of(def);
        }
        return new HashSet<>(roleRepository.findAllById(roleIds));
    }
}
